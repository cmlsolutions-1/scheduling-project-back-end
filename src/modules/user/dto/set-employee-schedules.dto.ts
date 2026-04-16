import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ArrayUnique, IsArray, IsEnum, Matches, ValidateNested } from "class-validator";
import { EmployeeScheduleDay } from "../entity/employee-schedule.entity";

export class EmployeeScheduleInputDto {
    @IsEnum(EmployeeScheduleDay)
    @ApiProperty({ enum: EmployeeScheduleDay })
    dayOfWeek: EmployeeScheduleDay;

    @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    @ApiProperty({ example: '08:00' })
    startTime: string;

    @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    @ApiProperty({ example: '18:00' })
    endTime: string;
}

export class SetEmployeeSchedulesDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => EmployeeScheduleInputDto)
    @ArrayUnique((schedule: EmployeeScheduleInputDto) => `${schedule.dayOfWeek}-${schedule.startTime}-${schedule.endTime}`)
    @ApiProperty({ type: [EmployeeScheduleInputDto] })
    schedules: EmployeeScheduleInputDto[];
}
