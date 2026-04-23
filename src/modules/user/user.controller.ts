import { BadRequestException, Body, Controller, Delete, Get, Param, Post, Put, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ApiBearerAuth } from '@nestjs/swagger';
import { ApiCreatedWrapped, ApiOkWrapped, ApiOkWrappedArray } from '../common/decorators/swagger/api-wrapped-response.decorator';
import { ApiCommonErrors } from '../common/decorators/swagger/api-helper-errors';
import { Roles } from '../auth/decorators/roles.decorators';
import { CreateUserDto } from './dto/create-user.dto';
import { ResponseUserDto } from './dto/response-user.dto';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from './entity/user.entity';
import { SetEmployeeServicesDto } from './dto/set-employee-services.dto';
import { ResponseServiceItemDto } from '../service-item/dto/response-service-item.dto';
import { SetEmployeeSchedulesDto } from './dto/set-employee-schedules.dto';
import { ResponseEmployeeScheduleDto } from './dto/response-employee-schedule.dto';
import { SearchPasswordResetUserDto } from './dto/search-password-reset-user.dto';
import { ResetUserPasswordDto } from './dto/reset-user-password.dto';
import { ResponsePasswordResetUserDto } from './dto/response-password-reset-user.dto';

@Controller('user')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('jwt')
export class UserController {
    constructor(private readonly service: UserService) { }

    @Post()
    @ApiCreatedWrapped(ResponseUserDto, 'Usuario creado')
    @ApiCommonErrors()
    @Roles('SUPER_ADMIN', 'ADMIN')
    create(@Body() dto: CreateUserDto, @Request() req) {
        const role = req.user.role;
        if (role === 'ADMIN') {
            if (!req.tenant) throw new BadRequestException('Empresa no identificada');
            if (req.user.companyId && req.user.companyId !== req.tenant.id) {
                throw new BadRequestException('Empresa no coincide con la sesion activa');
            }
            if (dto.role && dto.role !== 'EMPLOYEE') {
                throw new BadRequestException('Solo puede crear empleados');
            }
            return this.service.create({ ...dto, companyId: req.tenant.id, role: dto.role ?? 'EMPLOYEE' }, req.user.id, req.tenant.id);
        }

        if (dto.role === UserRole.SUPER_ADMIN) {
            return this.service.create({ ...dto, companyId: undefined }, req.user.id);
        }

        if (!dto.companyId) throw new BadRequestException('companyId es requerido');
        return this.service.create(dto, req.user.id, dto.companyId);
    }

    @Get()
    @ApiOkWrappedArray(ResponseUserDto, 'Lista de usuarios')
    @ApiCommonErrors()
    @Roles('SUPER_ADMIN', 'ADMIN')
    findAll(@Request() req) {
        const tenantId = req.user.role === 'ADMIN' ? req.tenant?.id : undefined;
        if (req.user.role === 'ADMIN') {
            if (!tenantId) throw new BadRequestException('Empresa no identificada');
            if (req.user.companyId && req.user.companyId !== tenantId) {
                throw new BadRequestException('Empresa no coincide con la sesion activa');
            }
        }
        return this.service.findAll(tenantId);
    }

    @Get('password-reset/search')
    @ApiOkWrappedArray(ResponsePasswordResetUserDto, 'Usuarios encontrados para restablecer contrasena')
    @ApiCommonErrors()
    @Roles('SUPER_ADMIN', 'ADMIN')
    findForPasswordReset(@Query() query: SearchPasswordResetUserDto, @Request() req) {
        const tenantId = req.user.role === 'ADMIN' ? req.tenant?.id : undefined;
        if (req.user.role === 'ADMIN') {
            if (!tenantId) throw new BadRequestException('Empresa no identificada');
            if (req.user.companyId && req.user.companyId !== tenantId) {
                throw new BadRequestException('Empresa no coincide con la sesion activa');
            }
        }
        return this.service.findForPasswordReset(query.email, tenantId);
    }

    @Put(':id/password')
    @ApiOkWrapped(ResponsePasswordResetUserDto, 'Contrasena restablecida')
    @ApiCommonErrors()
    @Roles('SUPER_ADMIN', 'ADMIN')
    resetPassword(@Param('id') id: string, @Body() dto: ResetUserPasswordDto, @Request() req) {
        const tenantId = req.user.role === 'ADMIN' ? req.tenant?.id : undefined;
        if (req.user.role === 'ADMIN') {
            if (!tenantId) throw new BadRequestException('Empresa no identificada');
            if (req.user.companyId && req.user.companyId !== tenantId) {
                throw new BadRequestException('Empresa no coincide con la sesion activa');
            }
        }
        return this.service.resetPassword(id, dto.password, req.user.id, tenantId);
    }

    @Get(':id/services')
    @ApiOkWrappedArray(ResponseServiceItemDto, 'Servicios del empleado')
    @ApiCommonErrors()
    @Roles('SUPER_ADMIN', 'ADMIN')
    findServices(@Param('id') id: string, @Request() req) {
        const tenantId = req.user.role === 'ADMIN' ? req.tenant?.id : undefined;
        if (req.user.role === 'ADMIN') {
            if (!tenantId) throw new BadRequestException('Empresa no identificada');
            if (req.user.companyId && req.user.companyId !== tenantId) {
                throw new BadRequestException('Empresa no coincide con la sesion activa');
            }
        }
        return this.service.findServices(id, tenantId);
    }

    @Put(':id/services')
    @ApiOkWrappedArray(ResponseServiceItemDto, 'Servicios del empleado actualizados')
    @ApiCommonErrors()
    @Roles('SUPER_ADMIN', 'ADMIN')
    setServices(@Param('id') id: string, @Body() dto: SetEmployeeServicesDto, @Request() req) {
        const tenantId = req.user.role === 'ADMIN' ? req.tenant?.id : undefined;
        if (req.user.role === 'ADMIN') {
            if (!tenantId) throw new BadRequestException('Empresa no identificada');
            if (req.user.companyId && req.user.companyId !== tenantId) {
                throw new BadRequestException('Empresa no coincide con la sesion activa');
            }
        }
        return this.service.setServices(id, dto.serviceIds, req.user.id, tenantId);
    }

    @Get(':id/schedules')
    @ApiOkWrappedArray(ResponseEmployeeScheduleDto, 'Horarios del empleado')
    @ApiCommonErrors()
    @Roles('SUPER_ADMIN', 'ADMIN')
    findSchedules(@Param('id') id: string, @Request() req) {
        const tenantId = req.user.role === 'ADMIN' ? req.tenant?.id : undefined;
        if (req.user.role === 'ADMIN') {
            if (!tenantId) throw new BadRequestException('Empresa no identificada');
            if (req.user.companyId && req.user.companyId !== tenantId) {
                throw new BadRequestException('Empresa no coincide con la sesion activa');
            }
        }
        return this.service.findSchedules(id, tenantId);
    }

    @Put(':id/schedules')
    @ApiOkWrappedArray(ResponseEmployeeScheduleDto, 'Horarios del empleado actualizados')
    @ApiCommonErrors()
    @Roles('SUPER_ADMIN', 'ADMIN')
    setSchedules(@Param('id') id: string, @Body() dto: SetEmployeeSchedulesDto, @Request() req) {
        const tenantId = req.user.role === 'ADMIN' ? req.tenant?.id : undefined;
        if (req.user.role === 'ADMIN') {
            if (!tenantId) throw new BadRequestException('Empresa no identificada');
            if (req.user.companyId && req.user.companyId !== tenantId) {
                throw new BadRequestException('Empresa no coincide con la sesion activa');
            }
        }
        return this.service.setSchedules(id, dto.schedules, req.user.id, tenantId);
    }

    @Get(':id')
    @ApiOkWrapped(ResponseUserDto, 'Empresa encontrada')
    @ApiCommonErrors()
    @Roles('SUPER_ADMIN', 'ADMIN')
    findOne(@Param('id') id: string, @Request() req) {
        const tenantId = req.user.role === 'ADMIN' ? req.tenant?.id : undefined;
        if (req.user.role === 'ADMIN') {
            if (!tenantId) throw new BadRequestException('Empresa no identificada');
            if (req.user.companyId && req.user.companyId !== tenantId) {
                throw new BadRequestException('Empresa no coincide con la sesion activa');
            }
        }
        return this.service.findOne(id, tenantId);
    }

    @Put(':id')
    @ApiOkWrapped(ResponseUserDto, 'Empresa actualizada')
    @ApiCommonErrors()
    @Roles('SUPER_ADMIN', 'ADMIN')
    update(@Body() dto: UpdateUserDto, @Param('id') id: string, @Request() req) {
        const tenantId = req.user.role === 'ADMIN' ? req.tenant?.id : undefined;
        if (req.user.role === 'ADMIN') {
            if (!tenantId) throw new BadRequestException('Empresa no identificada');
            if (req.user.companyId && req.user.companyId !== tenantId) {
                throw new BadRequestException('Empresa no coincide con la sesion activa');
            }
            if (dto.role && dto.role !== UserRole.EMPLOYEE) {
                throw new BadRequestException('Solo puede actualizar empleados');
            }
            if (dto.companyId && dto.companyId !== tenantId) {
                throw new BadRequestException('No puede mover usuarios a otra empresa');
            }
        }
        return this.service.update(
            id,
            req.user.role === 'ADMIN' ? { ...dto, companyId: tenantId, role: dto.role ?? UserRole.EMPLOYEE } : dto,
            req.user.id,
            tenantId,
        );
    }

    @Delete(':id')
    @ApiCommonErrors()
    @ApiOkWrapped(Boolean, 'Usuario eliminado exitosamente')
    @Roles('SUPER_ADMIN', 'ADMIN')
    remove(@Param('id') id: string, @Request() req) {
        const tenantId = req.user.role === 'ADMIN' ? req.tenant?.id : undefined;
        if (req.user.role === 'ADMIN') {
            if (!tenantId) throw new BadRequestException('Empresa no identificada');
            if (req.user.companyId && req.user.companyId !== tenantId) {
                throw new BadRequestException('Empresa no coincide con la sesion activa');
            }
        }
        return this.service.remove(id, req.user.id, tenantId);
    }

    @Put('active/:id')
    @ApiCommonErrors()
    @ApiOkWrapped(Boolean, 'Usuario activado exitosamente')
    @Roles('SUPER_ADMIN', 'ADMIN')
    active(@Param('id') id: string, @Request() req) {
        const tenantId = req.user.role === 'ADMIN' ? req.tenant?.id : undefined;
        if (req.user.role === 'ADMIN') {
            if (!tenantId) throw new BadRequestException('Empresa no identificada');
            if (req.user.companyId && req.user.companyId !== tenantId) {
                throw new BadRequestException('Empresa no coincide con la sesion activa');
            }
        }
        return this.service.active(id, req.user.id, tenantId);
    }

    @Get('me/profile')
    @ApiOkWrapped(ResponseUserDto, 'Perfil del usuario')
    @ApiCommonErrors()
    @Roles('SUPER_ADMIN', 'ADMIN', 'EMPLOYEE')
    findMe(@Request() req) {
        if (req.user.role !== 'SUPER_ADMIN' && !req.tenant) {
            throw new BadRequestException('Empresa no identificada');
        }
        if (req.user.role !== 'SUPER_ADMIN' && req.user.companyId && req.user.companyId !== req.tenant.id) {
            throw new BadRequestException('Empresa no coincide con la sesion activa');
        }
        return this.service.findOne(req.user.id, req.user.role === 'SUPER_ADMIN' ? undefined : req.tenant?.id);
    }
}
