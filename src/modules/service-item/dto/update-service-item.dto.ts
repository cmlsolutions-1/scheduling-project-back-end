import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsString, MaxLength, Min } from "class-validator";

export class UpdateServiceItemDto {
    @IsString()
    @IsOptional()
    @MaxLength(120)
    @ApiProperty({ required: false })
    name?: string;

    @IsString()
    @IsOptional()
    @MaxLength(500)
    @ApiProperty({ required: false })
    description?: string;

    @IsNumber()
    @IsOptional()
    @Min(0)
    @ApiProperty({ required: false })
    price?: number;

    @IsNumber()
    @IsOptional()
    @Min(0)
    @ApiProperty({ required: false })
    commissionRate?: number;
}
