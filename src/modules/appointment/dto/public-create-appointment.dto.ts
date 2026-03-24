import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsEmail, IsEnum, IsNotEmpty, IsNumberString, IsOptional, IsString, IsUUID, MaxLength, Min, IsInt } from "class-validator";
import { DocumentType } from "src/modules/client/entity/client.entity";

export class PublicCreateAppointmentDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    @ApiProperty()
    clientName: string;

    @IsString()
    @IsEmail()
    @MaxLength(200)
    @ApiProperty()
    clientEmail: string;

    @IsString()
    @IsNumberString()
    @MaxLength(20)
    @ApiProperty()
    clientPhone: string;

    @IsEnum(DocumentType)
    @ApiProperty({ enum: DocumentType })
    documentType: DocumentType;

    @IsString()
    @IsNumberString()
    @MaxLength(20)
    @ApiProperty()
    documentNumber: string;

    @IsString()
    @MaxLength(200)
    @ApiProperty()
    address: string;

    @IsDateString()
    @ApiProperty({ example: '1990-01-01' })
    birthDate: string;

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
