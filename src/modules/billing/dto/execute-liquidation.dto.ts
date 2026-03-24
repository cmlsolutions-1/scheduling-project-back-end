import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsEnum, IsOptional, IsUUID } from "class-validator";
import { LiquidationRange } from "./liquidation-filter.dto";

export class ExecuteLiquidationDto {
    @IsUUID()
    @ApiProperty()
    employeeId: string;

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
