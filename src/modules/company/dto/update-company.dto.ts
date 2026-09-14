import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString, MaxLength } from "class-validator";
import { IsIanaTimeZone } from "src/modules/common/validators/is-iana-time-zone.validator";

export class UpdateCompanyDto {
    @IsString()
    @IsOptional()
    @MaxLength(100)
    @ApiProperty({ required: false })
    name?: string;

    @IsString()
    @IsOptional()
    @MaxLength(500)
    @ApiProperty({ required: false })
    description?: string;

    @IsString()
    @IsOptional()
    @MaxLength(200)
    @ApiProperty({ required: false })
    frontendDomain?: string;

    @IsString()
    @IsOptional()
    @MaxLength(30)
    @ApiProperty({ required: false })
    whatsappPhoneNumber?: string;

    @IsString()
    @IsOptional()
    @IsIanaTimeZone()
    @MaxLength(100)
    @ApiProperty({ required: false, example: 'America/Bogota', description: 'Zona horaria IANA de la empresa' })
    timeZone?: string;
}
