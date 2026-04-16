import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsUUID, Matches } from "class-validator";

export class PublicAvailabilityQueryDto {
    @IsUUID()
    @ApiProperty()
    employeeId: string;

    @IsUUID()
    @ApiProperty()
    serviceId: string;

    @IsString()
    @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date debe tener formato YYYY-MM-DD' })
    @ApiProperty({ example: '2026-03-26' })
    date: string;
}
