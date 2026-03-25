import { ApiPropertyOptional } from "@nestjs/swagger";
import { AppointmentStatus } from "../entity/appointment.entity";



export class AppointmentFilterDto {
  @ApiPropertyOptional({ enum: AppointmentStatus })
  status?: AppointmentStatus;

  @ApiPropertyOptional()
  from?: string;

  @ApiPropertyOptional()
  to?: string;

  @ApiPropertyOptional()
  employeeId?: string;
}



export class AppointmentFilterEmployeeDto {
  @ApiPropertyOptional({ enum: AppointmentStatus })
  status?: AppointmentStatus;

  @ApiPropertyOptional()
  from?: string;

  @ApiPropertyOptional()
  to?: string;
}