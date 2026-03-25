import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

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
}
