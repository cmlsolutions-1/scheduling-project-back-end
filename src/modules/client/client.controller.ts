import { Body, Controller, Delete, Get, Param, Post, Put, Request, UseGuards } from '@nestjs/common';
import { ClientService } from './client.service';
import { ApiCreatedWrapped, ApiOkWrapped, ApiOkWrappedArray } from '../common/decorators/swagger/api-wrapped-response.decorator';
import { ApiCommonErrors } from '../common/decorators/swagger/api-helper-errors';
import { CreateClientDto } from './dto/create-client.dto';
import { ResponseClientDto } from './dto/response-client.dto';
import { JwtAuthGuard } from '../auth/guards/jwt/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorators';
import { ApiBearerAuth } from '@nestjs/swagger';
import { TenantGuard } from '../tenant/guards/tenant.guard';



@Controller('client')
@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
@ApiBearerAuth('jwt')
export class ClientController {

    constructor(private readonly service: ClientService) { }

    @Post()
    @ApiCreatedWrapped(ResponseClientDto, 'Cliente creado')
    @ApiCommonErrors()
    @Roles('ADMIN')
    create(@Body() dto: CreateClientDto, @Request() req) {
        return this.service.create(dto, req.tenant.id);
    }

    @Get()
    @ApiOkWrappedArray(ResponseClientDto, 'Lista de clientes')
    @ApiCommonErrors()
    @Roles('ADMIN')
    findAll(@Request() req) {
        return this.service.findAll(req.tenant.id);
    }

    @Get(':id')
    @ApiOkWrapped(ResponseClientDto, 'Cliente encontrado')
    @ApiCommonErrors()
    @Roles('ADMIN')
    findOne(@Param('id') id: string, @Request() req) {
        return this.service.findOne(id, req.tenant.id);
    }

    @Put(':id')
    @ApiOkWrapped(ResponseClientDto, 'Cliente actualizado')
    @ApiCommonErrors()
    @Roles('ADMIN')
    update(@Param('id') id: string, @Body() dto: CreateClientDto, @Request() req) {
        return this.service.update(id, dto, req.tenant.id);
    }

    @Delete(':id')
    @ApiCommonErrors()
    @ApiOkWrapped(Boolean, 'Cliente eliminado exitosamente')
    @Roles('ADMIN')
    remove(@Param('id') id: string, @Request() req) {
        return this.service.remove(id, req.tenant.id);
    }

    @Put('active/:id')
    @ApiCommonErrors()
    @ApiOkWrapped(Boolean, 'Cliente activado exitosamente')
    @Roles('ADMIN')
    active(@Param('id') id: string, @Request() req) {
        return this.service.active(id, req.tenant.id);
    }
}
