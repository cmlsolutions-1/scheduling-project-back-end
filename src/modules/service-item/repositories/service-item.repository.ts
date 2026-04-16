import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ServiceItem, ServiceItemStatus } from "../entity/service-item.entity";
import { ServiceItemMapper } from "../service-item.mapper";
import { ResponseServiceItemDto } from "../dto/response-service-item.dto";
import { MediaService } from "src/modules/media/media.service";

type ServiceItemWriteInput = Omit<Partial<ServiceItem>, 'imageId'> & {
    imageId?: string | null;
};

@Injectable()
export class ServiceItemRepository {
    constructor(
        @InjectRepository(ServiceItem)
        private readonly serviceRepo: Repository<ServiceItem>,
        private readonly mediaService: MediaService,
    ) {}

    async createService(data: ServiceItemWriteInput, tenantId: string, authorId: string): Promise<ResponseServiceItemDto> {
        const { imageId, ...serviceData } = data as any;
        const image = await this.mediaService.resolveImageForCompany(imageId, tenantId);

        const service = this.serviceRepo.create();
        Object.assign(service, {
            ...serviceData,
            status: ServiceItemStatus.ACTIVE,
            company: { id: tenantId } as any,
            ...(image !== undefined ? { image: image ?? null } : {}),
            createdBy: authorId,
            updatedBy: authorId,
        });

        const saved: ServiceItem = await this.serviceRepo.save(service);
        const full = await this.serviceRepo.findOne({ where: { id: saved.id }, relations: ['image'] });
        return ServiceItemMapper.toResponse(full ?? saved);
    }

    async findAll(tenantId: string): Promise<ResponseServiceItemDto[]> {
        const services = await this.serviceRepo.find({
            where: { status: ServiceItemStatus.ACTIVE, company: { id: tenantId } },
            relations: ['image'],
        });
        return ServiceItemMapper.toResponseList(services);
    }

    async findById(id: string, tenantId: string): Promise<ResponseServiceItemDto> {
        const service = await this.serviceRepo.findOne({
            where: { id, status: ServiceItemStatus.ACTIVE, company: { id: tenantId } },
            relations: ['image'],
        });
        if (!service) throw new NotFoundException('Servicio no encontrado');
        return ServiceItemMapper.toResponse(service);
    }

    async updateService(id: string, data: ServiceItemWriteInput, tenantId: string, authorId: string): Promise<ResponseServiceItemDto> {
        const service = await this.serviceRepo.findOne({
            where: { id, status: ServiceItemStatus.ACTIVE, company: { id: tenantId } },
            relations: ['image'],
        });
        if (!service) throw new BadRequestException('Servicio no encontrado');
        const { imageId, ...serviceData } = data as any;
        Object.assign(service, serviceData);
        if (imageId !== undefined) {
            const image = await this.mediaService.resolveImageForCompany(imageId, tenantId);
            (service as any).image = image ?? null;
        }
        service.updatedBy = authorId;
        const saved: ServiceItem = await this.serviceRepo.save(service);
        const full = await this.serviceRepo.findOne({ where: { id: saved.id }, relations: ['image'] });
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
