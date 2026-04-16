import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { ApiCommonErrors } from '../common/decorators/swagger/api-helper-errors';
import { ApiOkWrappedArray } from '../common/decorators/swagger/api-wrapped-response.decorator';
import { TenantGuard } from '../tenant/guards/tenant.guard';
import { ResponseServiceItemDto } from './dto/response-service-item.dto';
import { ServiceItemService } from './service-item.service';

@Controller('services')
export class PublicServiceItemController {
    constructor(private readonly service: ServiceItemService) { }

    @Get('public')
    @UseGuards(TenantGuard)
    @ApiOkWrappedArray(ResponseServiceItemDto, 'Servicios publicos')
    @ApiCommonErrors()
    findPublic(@Request() req) {
        return this.service.findAll(req.tenant.id);
    }
}
