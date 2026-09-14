import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsDateString, IsEmail, IsEnum, IsNotEmpty, IsNumberString, IsOptional, IsString, IsUUID, MaxLength, Min, IsInt, Matches } from "class-validator";
import { DocumentType } from "src/modules/client/entity/client.entity";
import { IsIanaTimeZone } from "src/modules/common/validators/is-iana-time-zone.validator";

export class PublicCreateAppointmentDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    @ApiProperty()
    clientName!: string;

    @IsString()
    @IsEmail()
    @MaxLength(200)
    @ApiProperty()
    clientEmail!: string;

    @IsString()
    @IsNumberString()
    @MaxLength(20)
    @ApiProperty()
    clientPhone!: string;

    @Transform(({ value }) => value === '' || value === null ? undefined : value)
    @IsEnum(DocumentType)
    @IsOptional()
    @ApiProperty({ enum: DocumentType, required: false, nullable: true })
    documentType?: DocumentType;

    @Transform(({ value }) => value === '' || value === null ? undefined : value)
    @IsString()
    @IsNumberString()
    @MaxLength(20)
    @IsOptional()
    @ApiProperty({ required: false, nullable: true })
    documentNumber?: string;

    @Transform(({ value }) => value === '' || value === null ? undefined : value)
    @IsString()
    @MaxLength(200)
    @IsOptional()
    @ApiProperty({ required: false, nullable: true })
    address?: string;

    @Transform(({ value }) => value === '' || value === null ? undefined : value)
    @IsDateString()
    @IsOptional()
    @ApiProperty({ example: '1990-01-01', required: false, nullable: true })
    birthDate?: string;

    @IsUUID()
    @ApiProperty()
    serviceId!: string;

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
