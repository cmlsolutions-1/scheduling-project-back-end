import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentController } from './appointment.controller';
import { AppointmentReminderService } from './appointment-reminder.service';
import { AppointmentService } from './appointment.service';
import { Appointment } from './entity/appointment.entity';
import { AppointmentRepository } from './repositories/appointment.repository';
import { Client } from '../client/entity/client.entity';
import { ClientModule } from '../client/client.module';
import { ServiceItem } from '../service-item/entity/service-item.entity';
import { User } from '../user/entity/user.entity';
import { EmployeeService } from '../user/entity/employee-service.entity';
import { Commission } from '../billing/entity/commission.entity';
import { Company } from '../company/entity/company.entity';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [TypeOrmModule.forFeature([Appointment, Client, ServiceItem, User, EmployeeService, Commission, Company]), ClientModule, CommonModule],
  controllers: [AppointmentController],
  providers: [AppointmentService, AppointmentRepository, AppointmentReminderService],
  exports: [TypeOrmModule, AppointmentRepository],
})
export class AppointmentModule {}
