import { ApiProperty } from '@nestjs/swagger';

export class ResendAppointmentNotificationResponseDto {
  @ApiProperty({ format: 'uuid' })
  appointmentId!: string;

  @ApiProperty({ example: 'WHATSAPP' })
  channel!: 'WHATSAPP';

  @ApiProperty({ example: true })
  sent!: boolean;
}
