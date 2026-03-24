import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from '../company/entity/company.entity';
import { TenantMiddleware } from './tenant.middleware';

@Module({
  imports: [TypeOrmModule.forFeature([Company])],
  providers: [TenantMiddleware],
  exports: [TenantMiddleware],
})
export class TenantModule {}
