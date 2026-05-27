import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsDateString, IsEmail, IsEnum, IsNotEmpty, IsNumberString, IsOptional, IsString, MaxLength } from "class-validator";
import { DocumentType } from "../entity/client.entity";

export class CreateClientDto {

    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    @ApiProperty()
    name: string;

    @IsString()
    @IsEmail()
    @MaxLength(200)
    @ApiProperty()
    email: string;

    @IsString()
    @IsNumberString()
    @MaxLength(20)
    @ApiProperty()
    phone: string;

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
    @ApiProperty({ required: false, nullable: true, example: '1990-01-01' })
    birthDate?: Date;

}
