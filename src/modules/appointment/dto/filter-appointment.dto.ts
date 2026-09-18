import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { AppointmentStatus } from '../entity/appointment.entity';

const fromDescription =
  'Limite inferior inclusivo. Use YYYY-MM-DD para iniciar ese dia en la zona horaria de la empresa, o un ISO 8601 con Z/offset para un instante exacto.';
const toDescription =
  'Limite superior inclusivo. Use YYYY-MM-DD para terminar ese dia en la zona horaria de la empresa, o un ISO 8601 con Z/offset para un instante exacto.';

export class AppointmentFilterDto {
  @ApiPropertyOptional({ enum: AppointmentStatus })
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @ApiPropertyOptional({ description: fromDescription, example: '2026-10-01' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ description: toDescription, example: '2026-10-31' })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({
    description: 'Identificador del empleado',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  employeeId?: string;
}

export class AppointmentFilterEmployeeDto {
  @ApiPropertyOptional({ enum: AppointmentStatus })
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @ApiPropertyOptional({ description: fromDescription, example: '2026-10-01' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ description: toDescription, example: '2026-10-31' })
  @IsOptional()
  @IsDateString()
  to?: string;
}
