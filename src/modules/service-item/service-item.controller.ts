import { Body, Controller, Delete, Get, Param, Post, Put, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorators';
import { JwtAuthGuard } from '../auth/guards/jwt/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ApiCommonErrors } from '../common/decorators/swagger/api-helper-errors';
import { ApiCreatedWrapped, ApiOkWrapped, ApiOkWrappedArray } from '../common/decorators/swagger/api-wrapped-response.decorator';
import { TenantGuard } from '../tenant/guards/tenant.guard';
import { CreateServiceItemDto } from './dto/create-service-item.dto';
import { ResponseServiceItemDto } from './dto/response-service-item.dto';
import { UpdateServiceItemDto } from './dto/update-service-item.dto';
import { ServiceItemService } from './service-item.service';

@Controller('services')
@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
@ApiBearerAuth('jwt')
export class ServiceItemController {
    constructor(private readonly service: ServiceItemService) {}

    @Post()
    @ApiCreatedWrapped(ResponseServiceItemDto, 'Servicio creado')
    @ApiCommonErrors()
    @Roles('ADMIN')
    create(@Body() dto: CreateServiceItemDto, @Request() req) {
        return this.service.create(dto, req.tenant.id, req.user.id);
    }

    @Get()
    @ApiOkWrappedArray(ResponseServiceItemDto, 'Lista de servicios')
    @ApiCommonErrors()
    @Roles('ADMIN')
    findAll(@Request() req) {
        return this.service.findAll(req.tenant.id);
    }

    @Get(':id')
    @ApiOkWrapped(ResponseServiceItemDto, 'Servicio encontrado')
    @ApiCommonErrors()
    @Roles('ADMIN')
    findOne(@Param('id') id: string, @Request() req) {
        return this.service.findOne(id, req.tenant.id);
    }

    @Put(':id')
    @ApiOkWrapped(ResponseServiceItemDto, 'Servicio actualizado')
    @ApiCommonErrors()
    @Roles('ADMIN')
    update(@Body() dto: UpdateServiceItemDto, @Param('id') id: string, @Request() req) {
        return this.service.update(id, dto, req.tenant.id, req.user.id);
    }

    @Delete(':id')
    @ApiCommonErrors()
    @ApiOkWrapped(Boolean, 'Servicio eliminado exitosamente')
    @Roles('ADMIN')
    remove(@Param('id') id: string, @Request() req) {
        return this.service.remove(id, req.tenant.id, req.user.id);
    }

    @Put('active/:id')
    @ApiCommonErrors()
    @ApiOkWrapped(Boolean, 'Servicio activado exitosamente')
    @Roles('ADMIN')
    active(@Param('id') id: string, @Request() req) {
        return this.service.active(id, req.tenant.id, req.user.id);
    }
}
