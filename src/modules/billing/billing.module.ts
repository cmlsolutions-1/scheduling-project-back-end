import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { Commission } from './entity/commission.entity';
import { Liquidation } from './entity/liquidation.entity';
import { User } from '../user/entity/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Commission, Liquidation, User])],
  controllers: [BillingController],
  providers: [BillingService],
  exports: [TypeOrmModule],
})
export class BillingModule {}
