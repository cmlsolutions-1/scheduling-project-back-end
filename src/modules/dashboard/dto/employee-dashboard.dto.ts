import { ApiProperty } from "@nestjs/swagger";

export class EmployeeDashboardDto {
    @ApiProperty()
    appointmentsToday: number;

    @ApiProperty()
    upcomingAppointments: number;

    @ApiProperty()
    completedServices: number;

    @ApiProperty()
    incomeGenerated: number;

    @ApiProperty()
    pendingCommission: number;
}
