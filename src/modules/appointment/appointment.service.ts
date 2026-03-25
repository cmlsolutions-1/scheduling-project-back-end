import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client, ClientStatus } from 'src/modules/client/entity/client.entity';
import { ClientRepository } from 'src/modules/client/repositories/client.repository.dto';
import { EmployeeService } from 'src/modules/user/entity/employee-service.entity';
import { User, UserRole, UserStatus } from 'src/modules/user/entity/user.entity';
import { ServiceItem, ServiceItemStatus } from 'src/modules/service-item/entity/service-item.entity';
import { Appointment, AppointmentStatus } from './entity/appointment.entity';
import { AppointmentRepository, AppointmentFilters } from './repositories/appointment.repository';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { PublicCreateAppointmentDto } from './dto/public-create-appointment.dto';
import { AppointmentMapper } from './appointment.mapper';
import { Commission, CommissionStatus } from 'src/modules/billing/entity/commission.entity';

@Injectable()
export class AppointmentService {
    constructor(
        private readonly appointmentRepo: AppointmentRepository,
        private readonly clientRepository: ClientRepository,
        @InjectRepository(Client)
        private readonly clientRepo: Repository<Client>,
        @InjectRepository(ServiceItem)
        private readonly serviceRepo: Repository<ServiceItem>,
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
        @InjectRepository(EmployeeService)
        private readonly employeeServiceRepo: Repository<EmployeeService>,
        @InjectRepository(Commission)
        private readonly commissionRepo: Repository<Commission>,
    ) {}

    async create(dto: CreateAppointmentDto, tenantId: string, authorId: string) {
        const client = await this.clientRepo.findOne({
            where: { id: dto.clientId, company: { id: tenantId }, status: ClientStatus.ACTIVE },
        });
        if (!client) throw new BadRequestException('Cliente no encontrado');

        const service = await this.serviceRepo.findOne({
            where: { id: dto.serviceId, company: { id: tenantId }, status: ServiceItemStatus.ACTIVE },
        });
        if (!service) throw new BadRequestException('Servicio no encontrado');

        let employee: User | null = null;
        if (dto.employeeId) {
            employee = await this.userRepo.findOne({
                where: { id: dto.employeeId, role: UserRole.EMPLOYEE, status: UserStatus.ACTIVE, company: { id: tenantId } },
            });
            if (!employee) throw new BadRequestException('Empleado no encontrado');
            await this.ensureEmployeeCanPerformService(employee.id, dto.serviceId, tenantId);
        }

        const appointment = new Appointment();
        appointment.company = { id: tenantId } as any;
        appointment.client = client;
        appointment.service = service;
        appointment.employee = employee ?? undefined;
        appointment.scheduledAt = new Date(dto.scheduledAt);
        appointment.durationMinutes = dto.durationMinutes;
        appointment.notes = dto.notes;
        appointment.status = AppointmentStatus.PENDING;
        appointment.servicePrice = Number(service.price);
        appointment.commissionRate = Number(service.commissionRate ?? 0);
        appointment.createdBy = authorId;
        appointment.updatedBy = authorId;

        const saved = await this.appointmentRepo.save(appointment);
        return AppointmentMapper.toResponse(saved);
    }

    async createPublic(dto: PublicCreateAppointmentDto, tenantId: string) {
        const service = await this.serviceRepo.findOne({
            where: { id: dto.serviceId, company: { id: tenantId }, status: ServiceItemStatus.ACTIVE },
        });
        if (!service) throw new BadRequestException('Servicio no encontrado');

        let employee: User | null = null;
        if (dto.employeeId) {
            employee = await this.userRepo.findOne({
                where: { id: dto.employeeId, role: UserRole.EMPLOYEE, status: UserStatus.ACTIVE, company: { id: tenantId } },
            });
            if (!employee) throw new BadRequestException('Empleado no encontrado');
            await this.ensureEmployeeCanPerformService(employee.id, dto.serviceId, tenantId);
        }

        const client = await this.clientRepository.upsertByDocumentNumber({
            name: dto.clientName,
            email: dto.clientEmail,
            phone: dto.clientPhone,
            documentType: dto.documentType,
            documentNumber: dto.documentNumber,
            address: dto.address,
            birthDate: new Date(dto.birthDate),
        }, tenantId);

        const appointment = new Appointment();
        appointment.company = { id: tenantId } as any;
        appointment.client = client;
        appointment.service = service;
        appointment.employee = employee ?? undefined;
        appointment.scheduledAt = new Date(dto.scheduledAt);
        appointment.durationMinutes = dto.durationMinutes;
        appointment.notes = dto.notes;
        appointment.status = AppointmentStatus.PENDING;
        appointment.servicePrice = Number(service.price);
        appointment.commissionRate = Number(service.commissionRate ?? 0);

        const saved = await this.appointmentRepo.save(appointment);
        return AppointmentMapper.toResponse(saved);
    }

    async findAll(tenantId: string, filters: AppointmentFilters = {}) {
        const appointments = await this.appointmentRepo.findAll(tenantId, filters);
        return AppointmentMapper.toResponseList(appointments);
    }

    async findOne(id: string, tenantId: string) {
        const appointment = await this.appointmentRepo.findById(id, tenantId);
        return AppointmentMapper.toResponse(appointment);
    }

    async findMy(employeeId: string, tenantId: string, filters: AppointmentFilters = {}) {
        const appointments = await this.appointmentRepo.findForEmployee(employeeId, tenantId, filters);
        return AppointmentMapper.toResponseList(appointments);
    }

    async updateStatus(id: string, tenantId: string, status: AppointmentStatus, authorId: string) {
        const appointment = await this.appointmentRepo.findById(id, tenantId);
        appointment.status = status;
        appointment.updatedBy = authorId;
        if (status === AppointmentStatus.COMPLETED) {
            appointment.completedAt = new Date();
            await this.createCommissionIfNeeded(appointment, tenantId, authorId);
        }
        const saved = await this.appointmentRepo.save(appointment);
        return AppointmentMapper.toResponse(saved);
    }

    private async createCommissionIfNeeded(appointment: Appointment, tenantId: string, authorId: string) {
        if (!appointment.employeeId) {
            throw new BadRequestException('La cita no tiene empleado asignado');
        }

        const existing = await this.commissionRepo.findOne({
            where: { appointment: { id: appointment.id } },
        });
        if (existing) return existing;

        const amount = Number(appointment.servicePrice) * (Number(appointment.commissionRate ?? 0) / 100);

        const commission = this.commissionRepo.create({
            company: { id: tenantId } as any,
            employee: { id: appointment.employeeId } as any,
            appointment: { id: appointment.id } as any,
            amount,
            status: CommissionStatus.PENDING,
            createdBy: authorId,
            updatedBy: authorId,
        });

        return this.commissionRepo.save(commission);
    }

    private async ensureEmployeeCanPerformService(employeeId: string, serviceId: string, tenantId: string) {
        const assignment = await this.employeeServiceRepo.findOne({
            where: {
                employee: { id: employeeId, role: UserRole.EMPLOYEE, status: UserStatus.ACTIVE, company: { id: tenantId } },
                service: { id: serviceId, status: ServiceItemStatus.ACTIVE, company: { id: tenantId } },
            },
        });

        if (!assignment) {
            throw new BadRequestException('El empleado no tiene asignado este servicio');
        }
    }
}
