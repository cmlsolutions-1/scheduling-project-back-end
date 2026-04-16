import { ApiProperty } from "@nestjs/swagger";
import { AppointmentStatus } from "src/modules/appointment/entity/appointment.entity";
import { CommissionStatus } from "../entity/commission.entity";

export class ResponseCommissionByLiquidationDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    amount: number;

    @ApiProperty({ enum: CommissionStatus })
    status: CommissionStatus;

    @ApiProperty()
    employeeId: string;

    @ApiProperty()
    appointmentId: string;

    @ApiProperty({ required: false })
    liquidationId?: string;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty({ required: false })
    appointmentScheduledAt?: Date;

    @ApiProperty({ required: false, enum: AppointmentStatus })
    appointmentStatus?: AppointmentStatus;

    @ApiProperty({ required: false })
    clientId?: string;

    @ApiProperty({ required: false })
    serviceId?: string;

    @ApiProperty({ required: false })
    servicePrice?: number;

    @ApiProperty({ required: false })
    commissionRate?: number;
}
