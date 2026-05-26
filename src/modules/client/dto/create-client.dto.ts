import { ApiProperty } from "@nestjs/swagger";
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

    @IsEnum(DocumentType)
    @IsOptional()
    @ApiProperty({ enum: DocumentType, required: false, nullable: true })
    documentType?: DocumentType;

    @IsString()
    @IsNumberString()
    @MaxLength(20)
    @IsOptional()
    @ApiProperty({ required: false, nullable: true })
    documentNumber?: string;

    @IsString()
    @MaxLength(200)
    @IsOptional()
    @ApiProperty({ required: false, nullable: true })
    address?: string;
    
    @IsDateString()
    @IsOptional()
    @ApiProperty({ required: false, nullable: true, example: '1990-01-01' })
    birthDate?: Date;

}
