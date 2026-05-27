import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsDateString, IsEmail, IsEnum, IsNotEmpty, IsNumberString, IsOptional, IsString, IsUUID, MaxLength, Min, IsInt } from "class-validator";
import { DocumentType } from "src/modules/client/entity/client.entity";

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
    @ApiProperty({ example: '2026-03-24T14:00:00Z' })
    scheduledAt!: string;

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
