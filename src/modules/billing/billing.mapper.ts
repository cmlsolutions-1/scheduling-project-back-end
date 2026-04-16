import { ResponseCommissionByLiquidationDto } from "./dto/response-commission-by-liquidation.dto";
import { Commission } from "./entity/commission.entity";
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

    static toCommissionResponse(commission: Commission): ResponseCommissionByLiquidationDto {
        return {
            id: commission.id,
            amount: Number(commission.amount),
            status: commission.status,
            employeeId: commission.employeeId,
            appointmentId: commission.appointmentId,
            liquidationId: commission.liquidationId,
            createdAt: commission.CreatedAt,
            appointmentScheduledAt: commission.appointment?.scheduledAt,
            appointmentStatus: commission.appointment?.status,
            clientId: commission.appointment?.clientId,
            serviceId: commission.appointment?.serviceId,
            servicePrice: commission.appointment ? Number(commission.appointment.servicePrice) : undefined,
            commissionRate: commission.appointment ? Number(commission.appointment.commissionRate) : undefined,
        };
    }

    static toCommissionList(commissions: Commission[]): ResponseCommissionByLiquidationDto[] {
        return commissions.map((commission) => this.toCommissionResponse(commission));
    }
}
