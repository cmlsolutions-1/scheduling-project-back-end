import { ApiProperty } from "@nestjs/swagger";
import { ServiceItemStatus } from "../entity/service-item.entity";

export class ResponseServiceItemDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    name: string;

    @ApiProperty({ required: false })
    description?: string;

    @ApiProperty()
    price: number;

    @ApiProperty()
    commissionRate: number;

    @ApiProperty({ enum: ServiceItemStatus })
    status: ServiceItemStatus;
}
