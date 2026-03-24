import { ApiProperty } from "@nestjs/swagger";
import { IsEnum } from "class-validator";
import { AppointmentStatus } from "../entity/appointment.entity";

export class UpdateAppointmentStatusDto {
    @IsEnum(AppointmentStatus)
    @ApiProperty({ enum: AppointmentStatus })
    status: AppointmentStatus;
}
