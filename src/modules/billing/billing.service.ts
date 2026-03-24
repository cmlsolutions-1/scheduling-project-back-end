import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { User, UserRole, UserStatus } from '../user/entity/user.entity';
import { Commission, CommissionStatus } from './entity/commission.entity';
import { Liquidation, LiquidationStatus } from './entity/liquidation.entity';
import { BillingMapper } from './billing.mapper';
import { LiquidationFilterDto, LiquidationRange } from './dto/liquidation-filter.dto';
import { ExecuteLiquidationDto } from './dto/execute-liquidation.dto';

@Injectable()
export class BillingService {
    constructor(
        @InjectRepository(Commission)
        private readonly commissionRepo: Repository<Commission>,
        @InjectRepository(Liquidation)
        private readonly liquidationRepo: Repository<Liquidation>,
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
    ) {}

    async preview(tenantId: string, filter: LiquidationFilterDto) {
        const { start, end } = this.resolvePeriod(filter);
        if (!filter.employeeId) {
            throw new BadRequestException('employeeId es requerido');
        }

        await this.ensureEmployee(filter.employeeId, tenantId);

        const commissions = await this.commissionRepo.find({
            where: {
                company: { id: tenantId },
                employee: { id: filter.employeeId },
                status: CommissionStatus.PENDING,
                CreatedAt: Between(start, end),
            } as any,
        });

        const totalAmount = commissions.reduce((sum, item) => sum + Number(item.amount), 0);
        return BillingMapper.toPreview(filter.employeeId, start, end, totalAmount, commissions.length);
    }

    async execute(tenantId: string, dto: ExecuteLiquidationDto, authorId: string) {
        const { start, end } = this.resolvePeriod(dto);
        await this.ensureEmployee(dto.employeeId, tenantId);

        const commissions = await this.commissionRepo.find({
            where: {
                company: { id: tenantId },
                employee: { id: dto.employeeId },
                status: CommissionStatus.PENDING,
                CreatedAt: Between(start, end),
            } as any,
        });

        if (!commissions.length) {
            throw new BadRequestException('No hay comisiones pendientes para liquidar en el rango seleccionado');
        }

        const totalAmount = commissions.reduce((sum, item) => sum + Number(item.amount), 0);

        const liquidation = this.liquidationRepo.create({
            company: { id: tenantId } as any,
            employee: { id: dto.employeeId } as any,
            periodStart: start,
            periodEnd: end,
            totalAmount,
            commissionCount: commissions.length,
            status: LiquidationStatus.PAID,
            paidAt: new Date(),
            createdBy: authorId,
            updatedBy: authorId,
        });

        const saved = await this.liquidationRepo.save(liquidation);

        for (const commission of commissions) {
            commission.status = CommissionStatus.LIQUIDATED;
            commission.liquidation = saved;
            commission.updatedBy = authorId;
        }
        await this.commissionRepo.save(commissions);

        return BillingMapper.toLiquidationResponse(saved);
    }

    async list(tenantId: string, filter: LiquidationFilterDto) {
        const where: any = { company: { id: tenantId } };
        if (filter.employeeId) where.employee = { id: filter.employeeId };

        if (filter.startDate && filter.endDate) {
            where.periodStart = Between(new Date(filter.startDate), new Date(filter.endDate));
        }

        const liquidations = await this.liquidationRepo.find({
            where,
            order: { periodStart: 'DESC' },
        });
        return BillingMapper.toLiquidationList(liquidations);
    }

    private resolvePeriod(filter: LiquidationFilterDto | ExecuteLiquidationDto) {
        if (filter.startDate && filter.endDate) {
            return {
                start: new Date(filter.startDate),
                end: new Date(filter.endDate),
            };
        }

        const baseDate = filter.date ? new Date(filter.date) : new Date();
        const range = filter.range ?? LiquidationRange.DAY;

        if (range === LiquidationRange.DAY) {
            const start = new Date(baseDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(baseDate);
            end.setHours(23, 59, 59, 999);
            return { start, end };
        }

        if (range === LiquidationRange.WEEK) {
            const start = new Date(baseDate);
            const day = start.getDay();
            const diff = day === 0 ? -6 : 1 - day;
            start.setDate(start.getDate() + diff);
            start.setHours(0, 0, 0, 0);
            const end = new Date(start);
            end.setDate(start.getDate() + 6);
            end.setHours(23, 59, 59, 999);
            return { start, end };
        }

        const start = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
        start.setHours(0, 0, 0, 0);
        const end = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);
        return { start, end };
    }

    private async ensureEmployee(employeeId: string, tenantId: string) {
        const employee = await this.userRepo.findOne({
            where: { id: employeeId, role: UserRole.EMPLOYEE, status: UserStatus.ACTIVE, company: { id: tenantId } },
        });
        if (!employee) {
            throw new BadRequestException('Empleado no encontrado');
        }
        return employee;
    }
}
