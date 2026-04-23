import { ApiProperty } from "@nestjs/swagger";
import { AppointmentStatus } from "../entity/appointment.entity";

export class ResponseAppointmentDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    scheduledAt: Date;

    @ApiProperty({ required: false })
    durationMinutes?: number;

    @ApiProperty({ required: false })
    notes?: string;

    @ApiProperty({ enum: AppointmentStatus })
    status: AppointmentStatus;

    @ApiProperty()
    servicePrice: number;

    @ApiProperty()
    commissionRate: number;

    @ApiProperty({ required: false })
    completedAt?: Date;

    @ApiProperty()
    serviceId: string;

    @ApiProperty()
    clientId: string;

    @ApiProperty({ required: false })
    clientName?: string;

    @ApiProperty({ required: false })
    clientPhone?: string;

    @ApiProperty({ required: false })
    employeeId?: string;
}
