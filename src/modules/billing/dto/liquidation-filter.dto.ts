import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsEnum, IsOptional, IsUUID } from "class-validator";

export enum LiquidationRange {
    DAY = 'DAY',
    WEEK = 'WEEK',
    MONTH = 'MONTH',
}

export class LiquidationFilterDto {
    @IsUUID()
    @IsOptional()
    @ApiProperty({ required: false })
    employeeId?: string;

    @IsEnum(LiquidationRange)
    @IsOptional()
    @ApiProperty({ required: false, enum: LiquidationRange })
    range?: LiquidationRange;

    @IsDateString()
    @IsOptional()
    @ApiProperty({ required: false })
    date?: string;

    @IsDateString()
    @IsOptional()
    @ApiProperty({ required: false })
    startDate?: string;

    @IsDateString()
    @IsOptional()
    @ApiProperty({ required: false })
    endDate?: string;
}
