import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { User } from '../user/entity/user.entity';
import { ServiceItem } from '../service-item/entity/service-item.entity';
import { Appointment } from '../appointment/entity/appointment.entity';
import { Commission } from '../billing/entity/commission.entity';
import { Liquidation } from '../billing/entity/liquidation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, ServiceItem, Appointment, Commission, Liquidation])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
