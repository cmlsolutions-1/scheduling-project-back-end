import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceItemController } from './service-item.controller';
import { ServiceItemService } from './service-item.service';
import { ServiceItem } from './entity/service-item.entity';
import { ServiceItemRepository } from './repositories/service-item.repository';
import { PublicServiceItemController } from './public-service-item.controller';
import { MediaModule } from '../media/media.module';

@Module({
  imports: [TypeOrmModule.forFeature([ServiceItem]), MediaModule],
  controllers: [PublicServiceItemController, ServiceItemController],
  providers: [ServiceItemService, ServiceItemRepository],
  exports: [TypeOrmModule, ServiceItemRepository],
})
export class ServiceItemModule {}
