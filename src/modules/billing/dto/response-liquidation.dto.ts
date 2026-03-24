import { ApiProperty } from "@nestjs/swagger";
import { LiquidationStatus } from "../entity/liquidation.entity";

export class ResponseLiquidationDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    employeeId: string;

    @ApiProperty()
    periodStart: Date;

    @ApiProperty()
    periodEnd: Date;

    @ApiProperty()
    totalAmount: number;

    @ApiProperty()
    commissionCount: number;

    @ApiProperty({ enum: LiquidationStatus })
    status: LiquidationStatus;

    @ApiProperty({ required: false })
    paidAt?: Date;
}
