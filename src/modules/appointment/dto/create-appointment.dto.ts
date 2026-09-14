import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsOptional, IsString, IsUUID, MaxLength, Min, IsInt, Matches } from "class-validator";
import { IsIanaTimeZone } from "src/modules/common/validators/is-iana-time-zone.validator";

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
    @IsOptional()
    @ApiProperty({ required: false, example: '2026-09-21T15:00:00.000Z', description: 'Formato UTC legado; prefiera los campos locales' })
    scheduledAt?: string;

    @IsString()
    @IsOptional()
    @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'scheduledLocalDate debe tener formato YYYY-MM-DD' })
    @ApiProperty({ required: false, example: '2026-09-21' })
    scheduledLocalDate?: string;

    @IsString()
    @IsOptional()
    @Matches(/^(?:[01]\d|2[0-3]):[0-5]\d$/, { message: 'scheduledLocalTime debe tener formato HH:mm' })
    @ApiProperty({ required: false, example: '10:00' })
    scheduledLocalTime?: string;

    @IsString()
    @IsOptional()
    @IsIanaTimeZone()
    @ApiProperty({ required: false, example: 'America/Bogota' })
    timeZone?: string;

    @IsInt()
    @Min(1)
    @IsOptional()
    @ApiProperty({ required: false, example: 60 })
    durationMinutes?: number;

    @IsString()
    @IsOptional()
    @MaxLength(500)
    @ApiProperty({ required: false })
    notes?: string;
}
