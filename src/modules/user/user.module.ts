import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entity/user.entity';
import { UserRepository } from './repositories/user.repository.dto';
import { ServiceItem } from '../service-item/entity/service-item.entity';
import { EmployeeService } from './entity/employee-service.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, ServiceItem, EmployeeService])],
  providers: [UserService, UserRepository],
  controllers: [UserController]
})
export class UserModule {}
