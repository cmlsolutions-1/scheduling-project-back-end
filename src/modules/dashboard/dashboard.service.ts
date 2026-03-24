import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { User, UserRole, UserStatus } from '../user/entity/user.entity';
import { ServiceItem, ServiceItemStatus } from '../service-item/entity/service-item.entity';
import { Appointment, AppointmentStatus } from '../appointment/entity/appointment.entity';
import { Commission, CommissionStatus } from '../billing/entity/commission.entity';
import { Liquidation } from '../billing/entity/liquidation.entity';

@Injectable()
export class DashboardService {
    constructor(
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
        @InjectRepository(ServiceItem)
        private readonly serviceRepo: Repository<ServiceItem>,
        @InjectRepository(Appointment)
        private readonly appointmentRepo: Repository<Appointment>,
        @InjectRepository(Commission)
        private readonly commissionRepo: Repository<Commission>,
        @InjectRepository(Liquidation)
        private readonly liquidationRepo: Repository<Liquidation>,
    ) {}

    async getAdminDashboard(tenantId: string) {
        const totalEmployees = await this.userRepo.count({
            where: { role: UserRole.EMPLOYEE, status: UserStatus.ACTIVE, company: { id: tenantId } },
        });

        const activeServices = await this.serviceRepo.count({
            where: { status: ServiceItemStatus.ACTIVE, company: { id: tenantId } },
        });

        const { startOfDay, endOfDay } = this.getDayRange(new Date());

        const appointmentsToday = await this.appointmentRepo.count({
            where: {
                company: { id: tenantId },
                scheduledAt: Between(startOfDay, endOfDay),
            },
        });

        const { startOfMonth, endOfMonth } = this.getMonthRange(new Date());

        const completedAppointments = await this.appointmentRepo.find({
            where: {
                company: { id: tenantId },
                status: AppointmentStatus.COMPLETED,
                completedAt: Between(startOfMonth, endOfMonth),
            },
            select: ['servicePrice'],
        });

        const monthlyRevenue = completedAppointments.reduce((sum, a) => sum + Number(a.servicePrice), 0);

        const pendingCommissions = await this.commissionRepo.count({
            where: { company: { id: tenantId }, status: CommissionStatus.PENDING },
        });

        const lastLiquidation = await this.liquidationRepo.findOne({
            where: { company: { id: tenantId } },
            order: { paidAt: 'DESC' },
        });

        return {
            totalEmployees,
            activeServices,
            appointmentsToday,
            monthlyRevenue,
            pendingCommissions,
            lastLiquidationAt: lastLiquidation?.paidAt,
        };
    }

    async getEmployeeDashboard(tenantId: string, employeeId: string) {
        const { startOfDay, endOfDay } = this.getDayRange(new Date());

        const appointmentsToday = await this.appointmentRepo.count({
            where: {
                company: { id: tenantId },
                employee: { id: employeeId },
                scheduledAt: Between(startOfDay, endOfDay),
            },
        });

        const upcomingAppointments = await this.appointmentRepo.count({
            where: {
                company: { id: tenantId },
                employee: { id: employeeId },
                status: AppointmentStatus.PENDING,
                scheduledAt: Between(new Date(), new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000)),
            },
        });

        const completedAppointments = await this.appointmentRepo.find({
            where: {
                company: { id: tenantId },
                employee: { id: employeeId },
                status: AppointmentStatus.COMPLETED,
            },
            select: ['servicePrice'],
        });

        const completedServices = completedAppointments.length;
        const incomeGenerated = completedAppointments.reduce((sum, a) => sum + Number(a.servicePrice), 0);

        const pendingCommissions = await this.commissionRepo.find({
            where: {
                company: { id: tenantId },
                employee: { id: employeeId },
                status: CommissionStatus.PENDING,
            },
            select: ['amount'],
        });

        const pendingCommission = pendingCommissions.reduce((sum, c) => sum + Number(c.amount), 0);

        return {
            appointmentsToday,
            upcomingAppointments,
            completedServices,
            incomeGenerated,
            pendingCommission,
        };
    }

    private getDayRange(date: Date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        return { startOfDay, endOfDay };
    }

    private getMonthRange(date: Date) {
        const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        startOfMonth.setHours(0, 0, 0, 0);
        const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        endOfMonth.setHours(23, 59, 59, 999);
        return { startOfMonth, endOfMonth };
    }
}
