import { ApiProperty } from "@nestjs/swagger";

export class AdminDashboardDto {
    @ApiProperty()
    totalEmployees: number;

    @ApiProperty()
    activeServices: number;

    @ApiProperty()
    appointmentsToday: number;

    @ApiProperty()
    monthlyRevenue: number;

    @ApiProperty()
    pendingCommissions: number;

    @ApiProperty({ required: false })
    lastLiquidationAt?: Date;
}
