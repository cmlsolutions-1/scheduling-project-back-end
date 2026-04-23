import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Between, Not, Repository } from "typeorm";
import { Appointment, AppointmentStatus } from "../entity/appointment.entity";

export interface AppointmentFilters {
    status?: AppointmentStatus;
    from?: Date;
    to?: Date;
    employeeId?: string;
}

@Injectable()
export class AppointmentRepository {
    constructor(
        @InjectRepository(Appointment)
        private readonly appointmentRepo: Repository<Appointment>,
    ) {}

    async save(appointment: Appointment): Promise<Appointment> {
        return this.appointmentRepo.save(appointment);
    }

    async findById(id: string, tenantId: string): Promise<Appointment> {
        const appointment = await this.appointmentRepo.findOne({
            where: { id, company: { id: tenantId } },
            relations: ['service', 'client', 'employee'],
        });
        if (!appointment) throw new NotFoundException('Cita no encontrada');
        return appointment;
    }

    async findAll(tenantId: string, filters: AppointmentFilters = {}): Promise<Appointment[]> {
        const where: any = { company: { id: tenantId } };
        if (filters.status) where.status = filters.status;
        if (filters.employeeId) where.employee = { id: filters.employeeId };
        if (filters.from && filters.to) where.scheduledAt = Between(filters.from, filters.to);

        return this.appointmentRepo.find({
            where,
            relations: ['service', 'client', 'employee'],
            order: { scheduledAt: 'ASC' },
        });
    }

    async findForEmployee(employeeId: string, tenantId: string, filters: AppointmentFilters = {}): Promise<Appointment[]> {
        return this.findAll(tenantId, { ...filters, employeeId });
    }

    async findBlockingAppointmentsForEmployeeOnDate(employeeId: string, tenantId: string, from: Date, to: Date): Promise<Appointment[]> {
        return this.appointmentRepo.find({
            where: {
                company: { id: tenantId },
                employee: { id: employeeId },
                status: Not(AppointmentStatus.CANCELLED),
                scheduledAt: Between(from, to),
            },
            order: { scheduledAt: 'ASC' },
        });
    }
}
