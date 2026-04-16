import { ApiProperty } from "@nestjs/swagger";

export class PublicAvailabilitySlotDto {
    @ApiProperty({ example: '08:00' })
    time: string;

    @ApiProperty()
    available: boolean;
}

export class PublicAvailabilityDto {
    @ApiProperty({ example: '2026-03-26' })
    date: string;

    @ApiProperty()
    employeeId: string;

    @ApiProperty()
    serviceId: string;

    @ApiProperty({ example: 60 })
    durationMinutes: number;

    @ApiProperty({ type: [String], example: ['08:00', '08:30', '10:00'] })
    availableSlots: string[];

    @ApiProperty({ type: [PublicAvailabilitySlotDto] })
    slots: PublicAvailabilitySlotDto[];
}
