import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entity/user.entity';
import { UserRepository } from './repositories/user.repository.dto';
import { ServiceItem } from '../service-item/entity/service-item.entity';
import { EmployeeService } from './entity/employee-service.entity';
import { EmployeeSchedule } from './entity/employee-schedule.entity';
import { PublicUserController } from './public-user.controller';
import { MediaModule } from '../media/media.module';
import { Session } from '../session/entity/session.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, ServiceItem, EmployeeService, EmployeeSchedule, Session]), MediaModule],
  providers: [UserService, UserRepository],
  controllers: [PublicUserController, UserController]
})
export class UserModule {}
