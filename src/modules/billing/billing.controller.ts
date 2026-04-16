import { Body, Controller, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorators';
import { JwtAuthGuard } from '../auth/guards/jwt/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ApiCommonErrors } from '../common/decorators/swagger/api-helper-errors';
import { ApiCreatedWrapped, ApiOkWrapped, ApiOkWrappedArray } from '../common/decorators/swagger/api-wrapped-response.decorator';
import { TenantGuard } from '../tenant/guards/tenant.guard';
import { BillingService } from './billing.service';
import { ResponseCommissionByLiquidationDto } from './dto/response-commission-by-liquidation.dto';
import { ExecuteLiquidationDto } from './dto/execute-liquidation.dto';
import { LiquidationFilterDto } from './dto/liquidation-filter.dto';
import { ResponseLiquidationDto } from './dto/response-liquidation.dto';
import { ResponseLiquidationPreviewDto } from './dto/response-liquidation-preview.dto';

@Controller('liquidations')
@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
@ApiBearerAuth('jwt')
export class BillingController {
    constructor(private readonly service: BillingService) {}

    @Get('preview')
    @ApiOkWrapped(ResponseLiquidationPreviewDto, 'Vista previa de liquidación')
    @ApiCommonErrors()
    @Roles('ADMIN')
    preview(@Query() query: LiquidationFilterDto, @Request() req) {
        return this.service.preview(req.tenant.id, query);
    }

    @Post('execute')
    @ApiCreatedWrapped(ResponseLiquidationDto, 'Liquidación ejecutada')
    @ApiCommonErrors()
    @Roles('ADMIN')
    execute(@Body() dto: ExecuteLiquidationDto, @Request() req) {
        return this.service.execute(req.tenant.id, dto, req.user.id);
    }

    @Get()
    @ApiOkWrappedArray(ResponseLiquidationDto, 'Historial de liquidaciones')
    @ApiCommonErrors()
    @Roles('ADMIN')
    list(@Query() query: LiquidationFilterDto, @Request() req) {
        return this.service.list(req.tenant.id, query);
    }

    @Get(':id/commissions')
    @ApiOkWrappedArray(ResponseCommissionByLiquidationDto, 'Comisiones de la liquidacion')
    @ApiCommonErrors()
    @Roles('ADMIN')
    findCommissions(@Param('id') id: string, @Request() req) {
        return this.service.findCommissionsByLiquidation(id, req.tenant.id);
    }
}
