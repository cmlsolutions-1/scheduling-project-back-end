import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min } from "class-validator";

export class CreateServiceItemDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(120)
    @ApiProperty()
    name: string;

    @IsString()
    @IsOptional()
    @MaxLength(500)
    @ApiProperty({ required: false })
    description?: string;

    @IsNumber()
    @Min(0)
    @ApiProperty({ example: 20000 })
    price: number;

    @IsNumber()
    @Min(0)
    @ApiProperty({ example: 40, description: 'Porcentaje de comisión' })
    commissionRate: number;
}
