import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client, ClientStatus } from 'src/modules/client/entity/client.entity';
import { ClientRepository } from 'src/modules/client/repositories/client.repository.dto';
import { EmployeeSchedule, EmployeeScheduleDay } from 'src/modules/user/entity/employee-schedule.entity';
import { EmployeeService } from 'src/modules/user/entity/employee-service.entity';
import { User, UserRole, UserStatus } from 'src/modules/user/entity/user.entity';
import { ServiceItem, ServiceItemStatus } from 'src/modules/service-item/entity/service-item.entity';
import { Appointment, AppointmentStatus } from './entity/appointment.entity';
import { AppointmentRepository, AppointmentFilters } from './repositories/appointment.repository';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { PublicAvailabilityDto, PublicAvailabilitySlotDto } from './dto/public-availability.dto';
import { PublicAvailabilityQueryDto } from './dto/public-availability-query.dto';
import { PublicCreateAppointmentDto } from './dto/public-create-appointment.dto';
import { AppointmentMapper } from './appointment.mapper';
import { Commission, CommissionStatus } from 'src/modules/billing/entity/commission.entity';

@Injectable()
export class AppointmentService {
    private static readonly DEFAULT_SERVICE_DURATION_MINUTES = 60;
    private static readonly SLOT_INTERVAL_MINUTES = 30;
    private static readonly WORKDAY_START_HOUR = 8;
    private static readonly WORKDAY_END_HOUR = 20;

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
                relations: ['employeeSchedules'],
            });
            if (!employee) throw new BadRequestException('Empleado no encontrado');
            await this.ensureEmployeeCanPerformService(employee.id, dto.serviceId, tenantId);
            await this.ensureEmployeeIsAvailable(
                employee,
                tenantId,
                new Date(dto.scheduledAt),
                dto.durationMinutes ?? this.getServiceDurationMinutes(service),
            );
        }

        const appointment = new Appointment();
        appointment.company = { id: tenantId } as any;
        appointment.client = client;
        appointment.service = service;
        appointment.employee = employee ?? undefined;
        appointment.scheduledAt = new Date(dto.scheduledAt);
        appointment.durationMinutes = dto.durationMinutes ?? this.getServiceDurationMinutes(service);
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
                relations: ['employeeSchedules'],
            });
            if (!employee) throw new BadRequestException('Empleado no encontrado');
            await this.ensureEmployeeCanPerformService(employee.id, dto.serviceId, tenantId);
            await this.ensureEmployeeIsAvailable(
                employee,
                tenantId,
                new Date(dto.scheduledAt),
                dto.durationMinutes ?? this.getServiceDurationMinutes(service),
            );
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
        appointment.durationMinutes = dto.durationMinutes ?? this.getServiceDurationMinutes(service);
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

    async findPublicAvailability(query: PublicAvailabilityQueryDto, tenantId: string): Promise<PublicAvailabilityDto> {
        const service = await this.serviceRepo.findOne({
            where: { id: query.serviceId, company: { id: tenantId }, status: ServiceItemStatus.ACTIVE },
        });
        if (!service) throw new BadRequestException('Servicio no encontrado');

        const employee = await this.userRepo.findOne({
            where: { id: query.employeeId, role: UserRole.EMPLOYEE, status: UserStatus.ACTIVE, company: { id: tenantId } },
            relations: ['employeeSchedules'],
        });
        if (!employee) throw new BadRequestException('Empleado no encontrado');

        await this.ensureEmployeeCanPerformService(employee.id, service.id, tenantId);

        const durationMinutes = this.getServiceDurationMinutes(service);
        const { startOfDay, endOfDay } = this.getDayBounds(query.date);
        const appointments = await this.appointmentRepo.findBlockingAppointmentsForEmployeeOnDate(
            employee.id,
            tenantId,
            startOfDay,
            endOfDay,
        );
        const slots = this.buildAvailabilitySlots(query.date, durationMinutes, appointments, employee.employeeSchedules ?? []);

        return {
            date: query.date,
            employeeId: employee.id,
            serviceId: service.id,
            durationMinutes,
            availableSlots: slots.filter((slot) => slot.available).map((slot) => slot.time),
            slots,
        };
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

    private async ensureEmployeeIsAvailable(employee: User, tenantId: string, scheduledAt: Date, durationMinutes: number) {
        const { startOfDay, endOfDay } = this.getDayBounds(this.formatDateOnly(scheduledAt));
        const appointments = await this.appointmentRepo.findBlockingAppointmentsForEmployeeOnDate(
            employee.id,
            tenantId,
            startOfDay,
            endOfDay,
        );

        const candidateStart = scheduledAt.getTime();
        const candidateEnd = candidateStart + durationMinutes * 60 * 1000;
        const scheduleBlocks = this.resolveScheduleBlocksForDate(this.formatDateOnly(scheduledAt), employee.employeeSchedules ?? []);

        const fitsSchedule = scheduleBlocks.some((block) =>
            candidateStart >= block.start.getTime() && candidateEnd <= block.end.getTime(),
        );

        if (!fitsSchedule) {
            throw new BadRequestException('El empleado no trabaja en ese horario');
        }

        const hasConflict = appointments.some((appointment) => {
            const appointmentStart = new Date(appointment.scheduledAt).getTime();
            const appointmentEnd = appointmentStart + this.getAppointmentDurationMinutes(appointment) * 60 * 1000;
            return candidateStart < appointmentEnd && candidateEnd > appointmentStart;
        });

        if (hasConflict) {
            throw new BadRequestException('El empleado ya tiene una cita en ese horario');
        }
    }

    private buildAvailabilitySlots(
        date: string,
        durationMinutes: number,
        appointments: Appointment[],
        schedules: EmployeeSchedule[],
    ): PublicAvailabilitySlotDto[] {
        const slots: PublicAvailabilitySlotDto[] = [];
        const scheduleBlocks = this.resolveScheduleBlocksForDate(date, schedules);
        const now = new Date();

        for (const block of scheduleBlocks) {
            for (
                let slotStart = new Date(block.start);
                slotStart.getTime() + durationMinutes * 60 * 1000 <= block.end.getTime();
                slotStart = new Date(slotStart.getTime() + AppointmentService.SLOT_INTERVAL_MINUTES * 60 * 1000)
            ) {
                const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60 * 1000);
                const overlaps = appointments.some((appointment) => {
                    const appointmentStart = new Date(appointment.scheduledAt).getTime();
                    const appointmentEnd = appointmentStart + this.getAppointmentDurationMinutes(appointment) * 60 * 1000;
                    return slotStart.getTime() < appointmentEnd && slotEnd.getTime() > appointmentStart;
                });
                const isPast = slotStart.getTime() < now.getTime();

                slots.push({
                    time: this.formatTime(slotStart),
                    available: !overlaps && !isPast,
                });
            }
        }

        return slots;
    }

    private getDayBounds(date: string): { startOfDay: Date; endOfDay: Date } {
        const [year, month, day] = date.split('-').map(Number);
        const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);

        if (this.formatDateOnly(startOfDay) !== date) {
            throw new BadRequestException('Fecha invalida');
        }

        return {
            startOfDay,
            endOfDay: new Date(year, month - 1, day, 23, 59, 59, 999),
        };
    }

    private getServiceDurationMinutes(service: ServiceItem): number {
        return service.durationMinutes ?? AppointmentService.DEFAULT_SERVICE_DURATION_MINUTES;
    }

    private getAppointmentDurationMinutes(appointment: Appointment): number {
        return appointment.durationMinutes ?? AppointmentService.DEFAULT_SERVICE_DURATION_MINUTES;
    }

    private formatTime(value: Date): string {
        return `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`;
    }

    private formatDateOnly(value: Date): string {
        return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
    }

    private resolveScheduleBlocksForDate(
        date: string,
        schedules: EmployeeSchedule[],
    ): Array<{ start: Date; end: Date }> {
        const dayOfWeek = this.resolveDayOfWeek(date);

        if (!schedules.length) {
            return [this.buildDefaultScheduleBlock(date)];
        }

        return schedules
            .filter((schedule) => schedule.dayOfWeek === dayOfWeek)
            .sort((a, b) => a.startTime.localeCompare(b.startTime))
            .map((schedule) => ({
                start: this.combineDateAndTime(date, schedule.startTime),
                end: this.combineDateAndTime(date, schedule.endTime),
            }));
    }

    private resolveDayOfWeek(date: string): EmployeeScheduleDay {
        const { startOfDay } = this.getDayBounds(date);
        const dayMap: Record<number, EmployeeScheduleDay> = {
            0: EmployeeScheduleDay.SUNDAY,
            1: EmployeeScheduleDay.MONDAY,
            2: EmployeeScheduleDay.TUESDAY,
            3: EmployeeScheduleDay.WEDNESDAY,
            4: EmployeeScheduleDay.THURSDAY,
            5: EmployeeScheduleDay.FRIDAY,
            6: EmployeeScheduleDay.SATURDAY,
        };

        return dayMap[startOfDay.getDay()];
    }

    private buildDefaultScheduleBlock(date: string): { start: Date; end: Date } {
        const { startOfDay } = this.getDayBounds(date);
        const endOfDay = new Date(startOfDay);

        startOfDay.setHours(AppointmentService.WORKDAY_START_HOUR, 0, 0, 0);
        endOfDay.setHours(AppointmentService.WORKDAY_END_HOUR, 0, 0, 0);

        return { start: startOfDay, end: endOfDay };
    }

    private combineDateAndTime(date: string, time: string): Date {
        const [year, month, day] = date.split('-').map(Number);
        const [hours, minutes] = time.split(':').map(Number);
        return new Date(year, month - 1, day, hours, minutes, 0, 0);
    }
}
