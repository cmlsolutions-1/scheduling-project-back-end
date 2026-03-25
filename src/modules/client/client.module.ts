import { Module } from '@nestjs/common';
import { ClientService } from './client.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Client } from './entity/client.entity';
import { ClientRepository } from './repositories/client.repository.dto';
import { ClientController } from './client.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Client])],
  providers: [ClientService, ClientRepository],
  controllers: [ClientController],
  exports: [ClientRepository],
})
export class ClientModule {}
