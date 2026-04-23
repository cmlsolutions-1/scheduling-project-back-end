import { Body, Controller, Delete, Get, Param, Post, Put, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorators';
import { JwtAuthGuard } from '../auth/guards/jwt/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ApiCommonErrors } from '../common/decorators/swagger/api-helper-errors';
import { ApiCreatedWrapped, ApiOkWrapped, ApiOkWrappedArray } from '../common/decorators/swagger/api-wrapped-response.decorator';
import { CompanyService } from './company.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { ResponseCompanyDto } from './dto/response-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { TenantGuard } from '../tenant/guards/tenant.guard';
import { ResponseCompanyWithAdminDto } from './dto/response-company-with-admin.dto';
import { ResponseCompanyAdminDto } from './dto/response-company-admin.dto';

@Controller('company')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('jwt')
export class CompanyController {
    constructor(private readonly service: CompanyService) {}

    @Post()
    @ApiCreatedWrapped(ResponseCompanyDto, 'Empresa creada')
    @ApiCommonErrors()
    @Roles('SUPER_ADMIN')
    create(@Body() dto: CreateCompanyDto, @Request() req) {
        return this.service.create(dto, req.user.id);
    }

    @Get()
    @ApiOkWrappedArray(ResponseCompanyDto, 'Lista de empresas')
    @ApiCommonErrors()
    @Roles('SUPER_ADMIN')
    findAll() {
        return this.service.findAll();
    }

    @Get('with-admin')
    @ApiOkWrappedArray(ResponseCompanyWithAdminDto, 'Lista de empresas con administrador')
    @ApiCommonErrors()
    @Roles('SUPER_ADMIN')
    findAllWithAdmin() {
        return this.service.findAllWithAdmin();
    }

    @Get('me')
    @UseGuards(TenantGuard)
    @ApiOkWrapped(ResponseCompanyDto, 'Empresa actual')
    @ApiCommonErrors()
    @Roles('ADMIN')
    findMine(@Request() req) {
        return this.service.findOne(req.tenant.id);
    }

    @Get(':id/admin')
    @ApiOkWrapped(ResponseCompanyAdminDto, 'Administrador de la empresa')
    @ApiCommonErrors()
    @Roles('SUPER_ADMIN')
    findAdminByCompanyId(@Param('id') id: string) {
        return this.service.findAdminByCompanyId(id);
    }

    @Get(':id')
    @ApiOkWrapped(ResponseCompanyDto, 'Empresa encontrada')
    @ApiCommonErrors()
    @Roles('SUPER_ADMIN')
    findOne(@Param('id') id: string) {
        return this.service.findOne(id);
    }

    @Put(':id')
    @ApiOkWrapped(ResponseCompanyDto, 'Empresa actualizada')
    @ApiCommonErrors()
    @Roles('SUPER_ADMIN')
    update(@Body() dto: UpdateCompanyDto, @Param('id') id: string, @Request() req) {
        return this.service.update(id, dto, req.user.id);
    }

    @Delete(':id')
    @ApiCommonErrors()
    @ApiOkWrapped(Boolean, 'Empresa eliminada exitosamente')
    @Roles('SUPER_ADMIN')
    remove(@Param('id') id: string, @Request() req) {
        return this.service.remove(id, req.user.id);
    }

    @Put('active/:id')
    @ApiCommonErrors()
    @ApiOkWrapped(Boolean, 'Empresa activada exitosamente')
    @Roles('SUPER_ADMIN')
    active(@Param('id') id: string, @Request() req) {
        return this.service.active(id, req.user.id);
    }
}
