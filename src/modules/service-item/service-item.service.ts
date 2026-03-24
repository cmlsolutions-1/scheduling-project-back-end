import { Injectable } from '@nestjs/common';
import { CreateServiceItemDto } from './dto/create-service-item.dto';
import { UpdateServiceItemDto } from './dto/update-service-item.dto';
import { ServiceItemRepository } from './repositories/service-item.repository';

@Injectable()
export class ServiceItemService {
    constructor(private readonly repository: ServiceItemRepository) {}

    create(dto: CreateServiceItemDto, tenantId: string, authorId: string) {
        return this.repository.createService(dto, tenantId, authorId);
    }

    findAll(tenantId: string) {
        return this.repository.findAll(tenantId);
    }

    findOne(id: string, tenantId: string) {
        return this.repository.findById(id, tenantId);
    }

    update(id: string, dto: UpdateServiceItemDto, tenantId: string, authorId: string) {
        return this.repository.updateService(id, dto, tenantId, authorId);
    }

    remove(id: string, tenantId: string, authorId: string) {
        return this.repository.deleteService(id, tenantId, authorId);
    }

    active(id: string, tenantId: string, authorId: string) {
        return this.repository.activateService(id, tenantId, authorId);
    }
}
