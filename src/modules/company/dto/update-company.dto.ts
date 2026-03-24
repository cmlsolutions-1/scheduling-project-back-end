import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString, MaxLength } from "class-validator";

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
}
