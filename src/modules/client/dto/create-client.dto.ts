import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsEnum, IsNotEmpty, IsNumberString, IsString, MaxLength } from "class-validator";
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
    
    @IsString()
    @MaxLength(200)
    @ApiProperty()
    birthDate: Date;

}
