import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsOptional, IsString, IsUUID, MaxLength, Min, IsInt } from "class-validator";

export class CreateAppointmentDto {
    @IsUUID()
    @ApiProperty()
    clientId: string;

    @IsUUID()
    @ApiProperty()
    serviceId: string;

    @IsUUID()
    @IsOptional()
    @ApiProperty({ required: false })
    employeeId?: string;

    @IsDateString()
    @ApiProperty({ example: '2026-03-24T14:00:00Z' })
    scheduledAt: string;

    @IsInt()
    @Min(0)
    @IsOptional()
    @ApiProperty({ required: false, example: 60 })
    durationMinutes?: number;

    @IsString()
    @IsOptional()
    @MaxLength(500)
    @ApiProperty({ required: false })
    notes?: string;
}
