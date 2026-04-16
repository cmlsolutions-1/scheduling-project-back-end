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
    durationMinutes: number;

    @ApiProperty()
    commissionRate: number;

    @ApiProperty({ required: false })
    imageId?: string;

    @ApiProperty({ required: false })
    imageUrl?: string;

    @ApiProperty({ enum: ServiceItemStatus })
    status: ServiceItemStatus;
}
