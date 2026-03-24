import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsEnum, IsNotEmpty, IsNumberString, IsString, MaxLength } from "class-validator";
import { ClientStatus, DocumentType } from "../entity/client.entity";



export class ResponseClientDto {

    @ApiProperty()
    id: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    @ApiProperty()
    name: string;

    @IsString()
    @MaxLength(200)
    @ApiProperty()
    description?: string;

    @IsString()
    @IsEmail()
    @MaxLength(200)
    @ApiProperty()
    email?: string;

    @ApiProperty()
    phone?: string | null;

    @ApiProperty({ enum: ClientStatus })
    status: ClientStatus;

    @IsString()
    @MaxLength(200)
    @ApiProperty()
    @IsEnum(DocumentType)
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