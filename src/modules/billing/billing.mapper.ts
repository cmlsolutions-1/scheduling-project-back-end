import { ResponseLiquidationDto } from "./dto/response-liquidation.dto";
import { ResponseLiquidationPreviewDto } from "./dto/response-liquidation-preview.dto";
import { Liquidation } from "./entity/liquidation.entity";

export class BillingMapper {
    static toLiquidationResponse(liquidation: Liquidation): ResponseLiquidationDto {
        return {
            id: liquidation.id,
            employeeId: liquidation.employeeId,
            periodStart: liquidation.periodStart,
            periodEnd: liquidation.periodEnd,
            totalAmount: Number(liquidation.totalAmount),
            commissionCount: liquidation.commissionCount,
            status: liquidation.status,
            paidAt: liquidation.paidAt ?? undefined,
        };
    }

    static toLiquidationList(liquidations: Liquidation[]): ResponseLiquidationDto[] {
        return liquidations.map((liquidation) => this.toLiquidationResponse(liquidation));
    }

    static toPreview(employeeId: string, start: Date, end: Date, total: number, count: number): ResponseLiquidationPreviewDto {
        return {
            employeeId,
            periodStart: start,
            periodEnd: end,
            totalAmount: total,
            commissionCount: count,
        };
    }
}
