import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsEnum, IsNotEmpty, IsNumberString, IsOptional, IsString, MaxLength } from "class-validator";
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
    @IsOptional()
    @ApiProperty({ required: false, nullable: true })
    @IsEnum(DocumentType)
    documentType?: DocumentType | null;

    @IsString()
    @IsNumberString()
    @MaxLength(20)
    @IsOptional()
    @ApiProperty({ required: false, nullable: true })
    documentNumber?: string | null;

    @IsString()
    @MaxLength(200)
    @IsOptional()
    @ApiProperty({ required: false, nullable: true })
    address?: string | null;

    @IsString()
    @MaxLength(200)
    @IsOptional()
    @ApiProperty({ required: false, nullable: true })
    birthDate?: Date | null;

}
