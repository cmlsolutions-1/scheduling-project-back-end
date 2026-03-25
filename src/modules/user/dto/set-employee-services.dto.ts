import { ApiProperty } from "@nestjs/swagger";
import { ArrayUnique, IsArray, IsUUID } from "class-validator";

export class SetEmployeeServicesDto {
    @IsArray()
    @ArrayUnique()
    @IsUUID('4', { each: true })
    @ApiProperty({ type: [String], example: ['550e8400-e29b-41d4-a716-446655440000'] })
    serviceIds: string[];
}
