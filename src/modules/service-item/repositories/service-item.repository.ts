import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ServiceItem, ServiceItemStatus } from "../entity/service-item.entity";
import { ServiceItemMapper } from "../service-item.mapper";
import { ResponseServiceItemDto } from "../dto/response-service-item.dto";

@Injectable()
export class ServiceItemRepository {
    constructor(
        @InjectRepository(ServiceItem)
        private readonly serviceRepo: Repository<ServiceItem>,
    ) {}

    async createService(data: Partial<ServiceItem>, tenantId: string, authorId: string): Promise<ResponseServiceItemDto> {
        const service = this.serviceRepo.create({
            ...data,
            status: ServiceItemStatus.ACTIVE,
            company: { id: tenantId } as any,
            createdBy: authorId,
            updatedBy: authorId,
        });

        const saved = await this.serviceRepo.save(service);
        const full = await this.serviceRepo.findOne({ where: { id: saved.id } });
        return ServiceItemMapper.toResponse(full ?? saved);
    }

    async findAll(tenantId: string): Promise<ResponseServiceItemDto[]> {
        const services = await this.serviceRepo.find({
            where: { status: ServiceItemStatus.ACTIVE, company: { id: tenantId } },
        });
        return ServiceItemMapper.toResponseList(services);
    }

    async findById(id: string, tenantId: string): Promise<ResponseServiceItemDto> {
        const service = await this.serviceRepo.findOne({
            where: { id, status: ServiceItemStatus.ACTIVE, company: { id: tenantId } },
        });
        if (!service) throw new NotFoundException('Servicio no encontrado');
        return ServiceItemMapper.toResponse(service);
    }

    async updateService(id: string, data: Partial<ServiceItem>, tenantId: string, authorId: string): Promise<ResponseServiceItemDto> {
        const service = await this.serviceRepo.findOne({
            where: { id, status: ServiceItemStatus.ACTIVE, company: { id: tenantId } },
        });
        if (!service) throw new BadRequestException('Servicio no encontrado');
        Object.assign(service, data);
        service.updatedBy = authorId;
        const saved = await this.serviceRepo.save(service);
        const full = await this.serviceRepo.findOne({ where: { id: saved.id } });
        return ServiceItemMapper.toResponse(full ?? saved);
    }

    async deleteService(id: string, tenantId: string, authorId: string): Promise<void> {
        const service = await this.serviceRepo.findOne({
            where: { id, status: ServiceItemStatus.ACTIVE, company: { id: tenantId } },
        });
        if (!service) throw new NotFoundException('Servicio no encontrado');
        service.status = ServiceItemStatus.INACTIVE;
        service.updatedBy = authorId;
        await this.serviceRepo.save(service);
    }

    async activateService(id: string, tenantId: string, authorId: string): Promise<void> {
        const service = await this.serviceRepo.findOne({
            where: { id, status: ServiceItemStatus.INACTIVE, company: { id: tenantId } },
        });
        if (!service) throw new NotFoundException('Servicio no encontrado');
        service.status = ServiceItemStatus.ACTIVE;
        service.updatedBy = authorId;
        await this.serviceRepo.save(service);
    }
}
