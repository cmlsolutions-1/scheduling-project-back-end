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
import { Company, CompanyStatus } from 'src/modules/company/entity/company.entity';
import { WhatsAppService } from 'src/modules/common/services/whatsapp.service';
import {
    canonicalizeIanaTimeZone,
    getLocalDayOfWeek,
    getUtcDayBounds,
    utcToZonedDateTime,
    zonedDateTimeToUtc,
} from 'src/modules/common/utils/time-zone.util';

interface AppointmentDateTimeInput {
    scheduledAt?: string;
    scheduledLocalDate?: string;
    scheduledLocalTime?: string;
    timeZone?: string;
}

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
        @InjectRepository(Company)
        private readonly companyRepo: Repository<Company>,
        private readonly whatsAppService: WhatsAppService,
    ) {}

    async create(dto: CreateAppointmentDto, tenantId: string, authorId: string) {
        const company = await this.getActiveCompany(tenantId);
        const scheduledDateTime = this.resolveScheduledDateTime(dto, company.timeZone);
        const client = await this.clientRepo.findOne({
            where: { id: dto.clientId, company: { id: tenantId }, status: ClientStatus.ACTIVE },
        });
        if (!client) throw new BadRequestException('Cliente no encontrado');

        const service = await this.serviceRepo.findOne({
            where: { id: dto.serviceId, company: { id: tenantId }, status: ServiceItemStatus.ACTIVE },
        });
        if (!service) throw new BadRequestException('Servicio no encontrado');

        let employee: User | null = null;
        let employeeServiceAssignment: EmployeeService | null = null;
        if (dto.employeeId) {
            employee = await this.userRepo.findOne({
                where: { id: dto.employeeId, role: UserRole.EMPLOYEE, status: UserStatus.ACTIVE, company: { id: tenantId } },
                relations: ['employeeSchedules'],
            });
            if (!employee) throw new BadRequestException('Empleado no encontrado');
            employeeServiceAssignment = await this.ensureEmployeeCanPerformService(employee.id, dto.serviceId, tenantId);
            await this.ensureEmployeeIsAvailable(
                employee,
                tenantId,
                scheduledDateTime.scheduledAt,
                scheduledDateTime.localDate,
                company.timeZone,
                dto.durationMinutes ?? this.getServiceDurationMinutes(service),
            );
        }

        const appointment = new Appointment();
        appointment.company = company;
        appointment.client = client;
        appointment.service = service;
        appointment.employee = employee ?? undefined;
        appointment.scheduledAt = scheduledDateTime.scheduledAt;
        appointment.durationMinutes = dto.durationMinutes ?? this.getServiceDurationMinutes(service);
        appointment.notes = dto.notes;
        appointment.status = AppointmentStatus.PENDING;
        appointment.servicePrice = Number(service.price);
        appointment.commissionRate = this.resolveAppointmentCommissionRate(service, employeeServiceAssignment);
        appointment.createdBy = authorId;
        appointment.updatedBy = authorId;

        const saved = await this.appointmentRepo.save(appointment);

        

        return AppointmentMapper.toResponse(saved, company.timeZone);
    }

    async createPublic(dto: PublicCreateAppointmentDto, tenantId: string) {
        const company = await this.getActiveCompany(tenantId);
        const scheduledDateTime = this.resolveScheduledDateTime(dto, company.timeZone);

        const service = await this.serviceRepo.findOne({
            where: { id: dto.serviceId, company: { id: tenantId }, status: ServiceItemStatus.ACTIVE },
        });
        if (!service) throw new BadRequestException('Servicio no encontrado');

        let employee: User | null = null;
        let employeeServiceAssignment: EmployeeService | null = null;
        if (dto.employeeId) {
            employee = await this.userRepo.findOne({
                where: { id: dto.employeeId, role: UserRole.EMPLOYEE, status: UserStatus.ACTIVE, company: { id: tenantId } },
                relations: ['employeeSchedules'],
            });
            if (!employee) throw new BadRequestException('Empleado no encontrado');
            employeeServiceAssignment = await this.ensureEmployeeCanPerformService(employee.id, dto.serviceId, tenantId);
            await this.ensureEmployeeIsAvailable(
                employee,
                tenantId,
                scheduledDateTime.scheduledAt,
                scheduledDateTime.localDate,
                company.timeZone,
                dto.durationMinutes ?? this.getServiceDurationMinutes(service),
            );
        }

        const client = await this.clientRepository.upsertByDocumentNumber({
            name: dto.clientName,
            email: dto.clientEmail,
            phone: dto.clientPhone,
            ...(dto.documentType !== undefined ? { documentType: dto.documentType } : {}),
            ...(dto.documentNumber !== undefined ? { documentNumber: dto.documentNumber } : {}),
            ...(dto.address !== undefined ? { address: dto.address } : {}),
            ...(dto.birthDate !== undefined ? { birthDate: new Date(dto.birthDate) } : {}),
        }, tenantId);

        const appointment = new Appointment();
        appointment.company = company;
        appointment.client = client;
        appointment.service = service;
        appointment.employee = employee ?? undefined;
        appointment.scheduledAt = scheduledDateTime.scheduledAt;
        appointment.durationMinutes = dto.durationMinutes ?? this.getServiceDurationMinutes(service);
        appointment.notes = dto.notes;
        appointment.status = AppointmentStatus.PENDING;
        appointment.servicePrice = Number(service.price);
        appointment.commissionRate = this.resolveAppointmentCommissionRate(service, employeeServiceAssignment);

        const saved = await this.appointmentRepo.save(appointment);
        await this.sendPublicAppointmentConfirmation({
            company,
            client,
            service,
            employee,
            appointment: saved,
        });
        return AppointmentMapper.toResponse(saved, company.timeZone);
    }

    async findAll(tenantId: string, filters: AppointmentFilters = {}) {
        const appointments = await this.appointmentRepo.findAll(tenantId, filters);
        return AppointmentMapper.toResponseList(appointments);
    }

    async findOne(id: string, tenantId: string) {
        const appointment = await this.appointmentRepo.findById(id, tenantId);
        return AppointmentMapper.toResponse(appointment, appointment.company.timeZone);
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
        return AppointmentMapper.toResponse(saved, appointment.company.timeZone);
    }

    async findPublicAvailability(query: PublicAvailabilityQueryDto, tenantId: string): Promise<PublicAvailabilityDto> {
        const company = await this.getActiveCompany(tenantId);
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
        const { startOfDay, endOfDay } = this.getSafeUtcDayBounds(query.date, company.timeZone);
        const appointments = await this.appointmentRepo.findBlockingAppointmentsForEmployeeOnDate(
            employee.id,
            tenantId,
            startOfDay,
            endOfDay,
        );
        const slots = this.buildAvailabilitySlots(
            query.date,
            company.timeZone,
            durationMinutes,
            appointments,
            employee.employeeSchedules ?? [],
        );

        return {
            date: query.date,
            timeZone: company.timeZone,
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
            company: { id: tenantId },
            employee: { id: appointment.employeeId },
            appointment: { id: appointment.id },
            amount,
            status: CommissionStatus.PENDING,
            createdBy: authorId,
            updatedBy: authorId,
        });

        return this.commissionRepo.save(commission);
    }

    private async ensureEmployeeCanPerformService(employeeId: string, serviceId: string, tenantId: string): Promise<EmployeeService> {
        const assignment = await this.employeeServiceRepo.findOne({
            where: {
                employee: { id: employeeId, role: UserRole.EMPLOYEE, status: UserStatus.ACTIVE, company: { id: tenantId } },
                service: { id: serviceId, status: ServiceItemStatus.ACTIVE, company: { id: tenantId } },
            },
        });

        if (!assignment) {
            throw new BadRequestException('El empleado no tiene asignado este servicio');
        }

        return assignment;
    }

    private resolveAppointmentCommissionRate(service: ServiceItem, assignment?: EmployeeService | null): number {
        const baseCommissionRate = Number(service.commissionRate ?? 0);
        const extraCommissionRate = Number(assignment?.extraCommissionRate ?? 0);
        return Number((baseCommissionRate + extraCommissionRate).toFixed(2));
    }

    private async ensureEmployeeIsAvailable(
        employee: User,
        tenantId: string,
        scheduledAt: Date,
        scheduledLocalDate: string,
        timeZone: string,
        durationMinutes: number,
    ) {
        const { startOfDay, endOfDay } = this.getSafeUtcDayBounds(scheduledLocalDate, timeZone);
        const appointments = await this.appointmentRepo.findBlockingAppointmentsForEmployeeOnDate(
            employee.id,
            tenantId,
            startOfDay,
            endOfDay,
        );

        const candidateStart = scheduledAt.getTime();
        const candidateEnd = candidateStart + durationMinutes * 60 * 1000;
        const scheduleBlocks = this.resolveScheduleBlocksForDate(
            scheduledLocalDate,
            timeZone,
            employee.employeeSchedules ?? [],
        );

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
        timeZone: string,
        durationMinutes: number,
        appointments: Appointment[],
        schedules: EmployeeSchedule[],
    ): PublicAvailabilitySlotDto[] {
        const slots: PublicAvailabilitySlotDto[] = [];
        const scheduleBlocks = this.resolveScheduleBlocksForDate(date, timeZone, schedules);
        const now = new Date();
        const emittedLocalTimes = new Set<string>();

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
                const localTime = utcToZonedDateTime(slotStart, timeZone).time;

                // A repeated wall-clock time during the DST fallback cannot be
                // disambiguated by the public local-date/local-time contract.
                if (emittedLocalTimes.has(localTime)) {
                    continue;
                }
                emittedLocalTimes.add(localTime);

                let isUnambiguousLocalTime = true;
                try {
                    isUnambiguousLocalTime = zonedDateTimeToUtc(date, localTime, timeZone).getTime() === slotStart.getTime();
                } catch {
                    isUnambiguousLocalTime = false;
                }

                slots.push({
                    time: localTime,
                    available: !overlaps && !isPast && isUnambiguousLocalTime,
                });
            }
        }

        return slots;
    }

    private getServiceDurationMinutes(service: ServiceItem): number {
        return service.durationMinutes ?? AppointmentService.DEFAULT_SERVICE_DURATION_MINUTES;
    }

    private getAppointmentDurationMinutes(appointment: Appointment): number {
        return appointment.durationMinutes ?? AppointmentService.DEFAULT_SERVICE_DURATION_MINUTES;
    }

    private resolveScheduleBlocksForDate(
        date: string,
        timeZone: string,
        schedules: EmployeeSchedule[],
    ): Array<{ start: Date; end: Date }> {
        const dayOfWeek = this.resolveDayOfWeek(date);

        if (!schedules.length) {
            return [this.buildDefaultScheduleBlock(date, timeZone)];
        }

        return schedules
            .filter((schedule) => schedule.dayOfWeek === dayOfWeek)
            .sort((a, b) => a.startTime.localeCompare(b.startTime))
            .map((schedule) => ({
                start: this.combineDateAndTime(date, schedule.startTime, timeZone),
                end: this.combineDateAndTime(date, schedule.endTime, timeZone),
            }));
    }

    private resolveDayOfWeek(date: string): EmployeeScheduleDay {
        const dayMap: Record<number, EmployeeScheduleDay> = {
            0: EmployeeScheduleDay.SUNDAY,
            1: EmployeeScheduleDay.MONDAY,
            2: EmployeeScheduleDay.TUESDAY,
            3: EmployeeScheduleDay.WEDNESDAY,
            4: EmployeeScheduleDay.THURSDAY,
            5: EmployeeScheduleDay.FRIDAY,
            6: EmployeeScheduleDay.SATURDAY,
        };

        return dayMap[getLocalDayOfWeek(date)];
    }

    private buildDefaultScheduleBlock(date: string, timeZone: string): { start: Date; end: Date } {
        return {
            start: this.combineDateAndTime(
                date,
                `${String(AppointmentService.WORKDAY_START_HOUR).padStart(2, '0')}:00`,
                timeZone,
            ),
            end: this.combineDateAndTime(
                date,
                `${String(AppointmentService.WORKDAY_END_HOUR).padStart(2, '0')}:00`,
                timeZone,
            ),
        };
    }

    private combineDateAndTime(date: string, time: string, timeZone: string): Date {
        try {
            return zonedDateTimeToUtc(date, time, timeZone);
        } catch (error) {
            throw new BadRequestException(error instanceof Error ? error.message : 'Fecha u hora invalida');
        }
    }

    private async sendPublicAppointmentConfirmation(input: {
        company: Company;
        client: Client;
        service: ServiceItem;
        employee: User | null;
        appointment: Appointment;
    }): Promise<void> {
        if (!input.company.whatsappPhoneNumber || !input.client.phone) {
            return;
        }

        const message = this.buildRandomConfirmationMessage(input);
        await this.whatsAppService.sendMessage({
            fromPhoneNumber: input.company.whatsappPhoneNumber,
            toPhoneNumber: input.client.phone,
            message,
        });
    }

    private buildRandomConfirmationMessage(input: {
        company: Company;
        client: Client;
        service: ServiceItem;
        employee: User | null;
        appointment: Appointment;
    }): string {
        const clientName = input.client.name;
        const companyName = input.company.name;
        const serviceName = input.service.name;
        const employeeName = input.employee?.name;
        const scheduledDate = this.formatWhatsAppDate(input.appointment.scheduledAt, input.company.timeZone);
        const scheduledTime = this.formatWhatsAppTime(input.appointment.scheduledAt, input.company.timeZone);
        const partyEmoji = '\u{1F389}';
        const checkEmoji = '\u{2705}';
        const calendarEmoji = '\u{1F4C5}';
        const clockEmoji = '\u{23F0}';
        const serviceEmoji = '\u{1F485}';
        const professionalEmoji = '\u{1F487}';
        const sparklesEmoji = '\u{2728}';
        const heartEmoji = '\u{1F90D}';
        const handsEmoji = '\u{1F64C}';

        const employeeLine = employeeName
            ? `\n${professionalEmoji} Profesional asignado: *${employeeName}*`
            : '';

        const confirmationMessages = [
            `${partyEmoji} Hola ${clientName}!\n\nTu cita en *${companyName}* ha quedado registrada con exito ${checkEmoji}\n\n${calendarEmoji} Fecha: *${scheduledDate}*\n${clockEmoji} Hora: *${scheduledTime}*\n${serviceEmoji} Servicio: *${serviceName}*${employeeLine}\n\nGracias por confiar en nosotros. Te esperamos! ${sparklesEmoji}`,
            `${checkEmoji} Hola ${clientName}, tu cita ya esta lista.\n\nHemos confirmado tu reserva en *${companyName}*.\n\n${calendarEmoji} Dia: *${scheduledDate}*\n${clockEmoji} Hora: *${scheduledTime}*\n${serviceEmoji} Servicio: *${serviceName}*${employeeLine}\n\nSi necesitas cambios, escribenos por este medio.`,
            `${partyEmoji} Reserva confirmada.\n\nHola ${clientName}, tu cita en *${companyName}* quedo agendada correctamente.\n\n${calendarEmoji} Fecha: *${scheduledDate}*\n${clockEmoji} Hora: *${scheduledTime}*\n${serviceEmoji} Servicio: *${serviceName}*${employeeLine}\n\nTe esperamos con gusto ${heartEmoji}`,
            `${sparklesEmoji} Hola ${clientName}, ya confirmamos tu cita en *${companyName}*.\n\n${clockEmoji} Hora: *${scheduledTime}*\n${calendarEmoji} Fecha: *${scheduledDate}*\n${serviceEmoji} Servicio reservado: *${serviceName}*${employeeLine}\n\nGracias por elegirnos ${handsEmoji}`,
            `${checkEmoji} Todo listo, ${clientName}.\n\nTu cita fue creada exitosamente en *${companyName}*.\n\n${calendarEmoji} Fecha: *${scheduledDate}*\n${clockEmoji} Hora: *${scheduledTime}*\n${serviceEmoji} Servicio: *${serviceName}*${employeeLine}\n\nTe esperamos para atenderte con mucho gusto ${sparklesEmoji}`,
        ];

        return confirmationMessages[Math.floor(Math.random() * confirmationMessages.length)];
    }

    private formatWhatsAppDate(value: Date, timeZone: string): string {
        return new Intl.DateTimeFormat('es-CO', {
            timeZone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        }).format(new Date(value));
    }

    private formatWhatsAppTime(value: Date, timeZone: string): string {
        return new Intl.DateTimeFormat('es-CO', {
            timeZone,
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        }).format(new Date(value));
    }

    private async getActiveCompany(tenantId: string): Promise<Company> {
        const company = await this.companyRepo.findOne({
            where: { id: tenantId, status: CompanyStatus.ACTIVE },
        });
        if (!company) throw new BadRequestException('Empresa no encontrada');
        return company;
    }

    private resolveScheduledDateTime(
        input: AppointmentDateTimeInput,
        companyTimeZone: string,
    ): { scheduledAt: Date; localDate: string } {
        const hasAnyLocalField = input.scheduledLocalDate !== undefined
            || input.scheduledLocalTime !== undefined
            || input.timeZone !== undefined;

        if (hasAnyLocalField) {
            if (!input.scheduledLocalDate || !input.scheduledLocalTime || !input.timeZone) {
                throw new BadRequestException(
                    'scheduledLocalDate, scheduledLocalTime y timeZone deben enviarse juntos',
                );
            }

            const canonicalCompanyTimeZone = canonicalizeIanaTimeZone(companyTimeZone);
            const canonicalInputTimeZone = canonicalizeIanaTimeZone(input.timeZone);
            if (canonicalInputTimeZone !== canonicalCompanyTimeZone) {
                throw new BadRequestException('timeZone debe coincidir con la zona horaria de la empresa');
            }

            const scheduledAt = this.combineDateAndTime(
                input.scheduledLocalDate,
                input.scheduledLocalTime,
                canonicalCompanyTimeZone,
            );

            if (input.scheduledAt) {
                const suppliedScheduledAt = this.parseAbsoluteScheduledAt(input.scheduledAt);
                if (suppliedScheduledAt.getTime() !== scheduledAt.getTime()) {
                    throw new BadRequestException('scheduledAt no coincide con la fecha y hora locales');
                }
            }

            return { scheduledAt, localDate: input.scheduledLocalDate };
        }

        if (!input.scheduledAt) {
            throw new BadRequestException(
                'Debe enviar scheduledLocalDate, scheduledLocalTime y timeZone',
            );
        }

        const scheduledAt = this.parseAbsoluteScheduledAt(input.scheduledAt);
        return {
            scheduledAt,
            localDate: utcToZonedDateTime(scheduledAt, companyTimeZone).date,
        };
    }

    private parseAbsoluteScheduledAt(value: string): Date {
        if (!/(?:Z|[+-]\d{2}:\d{2})$/i.test(value)) {
            throw new BadRequestException('scheduledAt debe incluir Z o un offset UTC explicito');
        }

        const result = new Date(value);
        if (Number.isNaN(result.getTime())) {
            throw new BadRequestException('scheduledAt es invalido');
        }
        return result;
    }

    private getSafeUtcDayBounds(date: string, timeZone: string): { startOfDay: Date; endOfDay: Date } {
        try {
            return getUtcDayBounds(date, timeZone);
        } catch (error) {
            throw new BadRequestException(error instanceof Error ? error.message : 'Fecha invalida');
        }
    }
}
