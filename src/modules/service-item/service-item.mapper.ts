import { ResponseServiceItemDto } from "./dto/response-service-item.dto";
import { ServiceItem } from "./entity/service-item.entity";

export class ServiceItemMapper {
    static toResponse(service: ServiceItem): ResponseServiceItemDto {
        return {
            id: service.id,
            name: service.name,
            description: service.description,
            price: Number(service.price),
            commissionRate: Number(service.commissionRate),
            status: service.status,
        };
    }

    static toResponseList(services: ServiceItem[]): ResponseServiceItemDto[] {
        return services.map((service) => this.toResponse(service));
    }
}
