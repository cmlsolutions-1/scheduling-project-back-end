import { Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";
import { ArrayUnique, IsArray, IsOptional, IsUUID, ValidateNested } from "class-validator";
import { EmployeeServiceAssignmentInputDto } from "./employee-service-assignment-input.dto";

export class SetEmployeeServicesDto {
    @IsArray()
    @ArrayUnique()
    @IsUUID('4', { each: true })
    @IsOptional()
    @ApiProperty({
        type: [String],
        example: ['550e8400-e29b-41d4-a716-446655440000'],
        required: false,
        deprecated: true,
    })
    serviceIds?: string[];

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => EmployeeServiceAssignmentInputDto)
    @IsOptional()
    @ApiProperty({ type: [EmployeeServiceAssignmentInputDto], required: false })
    services?: EmployeeServiceAssignmentInputDto[];
}
