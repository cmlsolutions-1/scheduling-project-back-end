import { Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsUUID, Max, Min } from "class-validator";

export class EmployeeServiceAssignmentInputDto {
    @IsUUID()
    @ApiProperty()
    serviceId!: string;

    @Type(() => Number)
    @IsOptional()
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    @Max(100)
    @ApiProperty({ required: false, default: 0, example: 10 })
    extraCommissionRate?: number;
}
