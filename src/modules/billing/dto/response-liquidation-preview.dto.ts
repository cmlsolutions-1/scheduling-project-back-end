import { ApiProperty } from "@nestjs/swagger";

export class ResponseLiquidationPreviewDto {
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
}
