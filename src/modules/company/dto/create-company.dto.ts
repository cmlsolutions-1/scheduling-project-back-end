import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";
import { IsIanaTimeZone } from "src/modules/common/validators/is-iana-time-zone.validator";

export class CreateCompanyDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    @ApiProperty()
    name: string;

    @IsString()
    @IsOptional()
    @MaxLength(500)
    @ApiProperty({ required: false })
    description?: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    @ApiProperty({
        description: 'Dominio o ruta del frontend, ejemplo: empresa1',
    })
    frontendDomain: string;

    @IsString()
    @IsOptional()
    @MaxLength(30)
    @ApiProperty({ required: false, description: 'Numero emisor de WhatsApp de la empresa' })
    whatsappPhoneNumber?: string;

    @IsString()
    @IsNotEmpty()
    @IsIanaTimeZone()
    @MaxLength(100)
    @ApiProperty({ example: 'America/Bogota', description: 'Zona horaria IANA de la empresa' })
    timeZone: string;
}
