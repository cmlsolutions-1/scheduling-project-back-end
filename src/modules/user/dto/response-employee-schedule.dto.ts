import { ApiProperty } from "@nestjs/swagger";
import { EmployeeScheduleDay } from "../entity/employee-schedule.entity";

export class ResponseEmployeeScheduleDto {
    @ApiProperty()
    id: string;

    @ApiProperty({ enum: EmployeeScheduleDay })
    dayOfWeek: EmployeeScheduleDay;

    @ApiProperty({ example: '08:00' })
    startTime: string;

    @ApiProperty({ example: '18:00' })
    endTime: string;
}
