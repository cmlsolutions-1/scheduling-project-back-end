import { ApiProperty } from "@nestjs/swagger";
import { ServiceItemStatus } from "src/modules/service-item/entity/service-item.entity";

export class ResponseEmployeeServiceAssignmentDto {
    @ApiProperty()
    serviceId!: string;

    @ApiProperty()
    serviceName!: string;

    @ApiProperty()
    price!: number;

    @ApiProperty()
    durationMinutes!: number;

    @ApiProperty()
    baseCommissionRate!: number;

    @ApiProperty()
    extraCommissionRate!: number;

    @ApiProperty()
    totalCommissionRate!: number;

    @ApiProperty({ required: false })
    imageId?: string;

    @ApiProperty({ required: false })
    imageUrl?: string;

    @ApiProperty({ enum: ServiceItemStatus })
    status!: ServiceItemStatus;
}
