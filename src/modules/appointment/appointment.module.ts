import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentController } from './appointment.controller';
import { AppointmentService } from './appointment.service';
import { Appointment } from './entity/appointment.entity';
import { AppointmentRepository } from './repositories/appointment.repository';
import { Client } from '../client/entity/client.entity';
import { ClientModule } from '../client/client.module';
import { ServiceItem } from '../service-item/entity/service-item.entity';
import { User } from '../user/entity/user.entity';
import { Commission } from '../billing/entity/commission.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Appointment, Client, ServiceItem, User, Commission]), ClientModule],
  controllers: [AppointmentController],
  providers: [AppointmentService, AppointmentRepository],
  exports: [TypeOrmModule, AppointmentRepository],
})
export class AppointmentModule {}
