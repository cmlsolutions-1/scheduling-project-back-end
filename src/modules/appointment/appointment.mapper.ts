import { ResponseAppointmentDto } from "./dto/response-appointment.dto";
import { Appointment } from "./entity/appointment.entity";

export class AppointmentMapper {
    static toResponse(appointment: Appointment): ResponseAppointmentDto {
        return {
            id: appointment.id,
            scheduledAt: appointment.scheduledAt,
            durationMinutes: appointment.durationMinutes ?? undefined,
            notes: appointment.notes ?? undefined,
            status: appointment.status,
            servicePrice: Number(appointment.servicePrice),
            commissionRate: Number(appointment.commissionRate),
            completedAt: appointment.completedAt ?? undefined,
            serviceId: appointment.serviceId,
            clientId: appointment.clientId,
            employeeId: appointment.employeeId ?? undefined,
        };
    }

    static toResponseList(appointments: Appointment[]): ResponseAppointmentDto[] {
        return appointments.map((appointment) => this.toResponse(appointment));
    }
}
