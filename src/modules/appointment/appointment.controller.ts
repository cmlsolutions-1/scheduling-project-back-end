import { Body, Controller, Get, Param, Post, Put, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorators';
import { JwtAuthGuard } from '../auth/guards/jwt/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ApiCommonErrors } from '../common/decorators/swagger/api-helper-errors';
import { ApiCreatedWrapped, ApiOkWrapped, ApiOkWrappedArray } from '../common/decorators/swagger/api-wrapped-response.decorator';
import { TenantGuard } from '../tenant/guards/tenant.guard';
import { AppointmentService } from './appointment.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { PublicAvailabilityDto } from './dto/public-availability.dto';
import { PublicAvailabilityQueryDto } from './dto/public-availability-query.dto';
import { PublicCreateAppointmentDto } from './dto/public-create-appointment.dto';
import { ResponseAppointmentDto } from './dto/response-appointment.dto';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto';
import { AppointmentFilterDto, AppointmentFilterEmployeeDto } from './dto/filter-appointment.dto';

@Controller('appointments')
export class AppointmentController {
    constructor(private readonly service: AppointmentService) {}

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
    @ApiBearerAuth('jwt')
    @ApiCreatedWrapped(ResponseAppointmentDto, 'Cita creada')
    @ApiCommonErrors()
    @Roles('ADMIN')
    create(@Body() dto: CreateAppointmentDto, @Request() req) {
        return this.service.create(dto, req.tenant.id, req.user.id);
    }

    @Post('public')
    @UseGuards(TenantGuard)
    @ApiCreatedWrapped(ResponseAppointmentDto, 'Cita creada por cliente')
    @ApiCommonErrors()
    createPublic(@Body() dto: PublicCreateAppointmentDto, @Request() req) {
        return this.service.createPublic(dto, req.tenant.id);
    }

    @Get('public/availability')
    @UseGuards(TenantGuard)
    @ApiOkWrapped(PublicAvailabilityDto, 'Disponibilidad publica')
    @ApiCommonErrors()
    findPublicAvailability(@Query() query: PublicAvailabilityQueryDto, @Request() req) {
        return this.service.findPublicAvailability(query, req.tenant.id);
    }

    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
    @ApiBearerAuth('jwt')
    @ApiOkWrappedArray(ResponseAppointmentDto, 'Lista de citas')
    @ApiCommonErrors()
    @Roles('ADMIN')
    findAll(
        @Request() req,
        @Query() query: AppointmentFilterDto,
    ) {
         return this.service.findAll(req.tenant.id, {
            status: query.status,
            from: query.from ? new Date(query.from) : undefined,
            to: query.to ? new Date(query.to) : undefined,
            employeeId: query.employeeId,
        });
    }

    @Get('my')
    @UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
    @ApiBearerAuth('jwt')
    @ApiOkWrappedArray(ResponseAppointmentDto, 'Citas del empleado')
    @ApiCommonErrors()
    @Roles('EMPLOYEE')
    findMy(
        @Request() req,
        @Query() query: AppointmentFilterEmployeeDto,
    ) {
        return this.service.findMy(req.user.id, req.tenant.id, {
            status: query.status,
            from: query.from ? new Date(query.from) : undefined,
            to: query.to ? new Date(query.to) : undefined,
        });
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
    @ApiBearerAuth('jwt')
    @ApiOkWrapped(ResponseAppointmentDto, 'Cita encontrada')
    @ApiCommonErrors()
    @Roles('ADMIN')
    findOne(@Param('id') id: string, @Request() req) {
        return this.service.findOne(id, req.tenant.id);
    }

    @Put(':id/status')
    @UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
    @ApiBearerAuth('jwt')
    @ApiOkWrapped(ResponseAppointmentDto, 'Estado de cita actualizado')
    @ApiCommonErrors()
    @Roles('ADMIN')
    updateStatus(@Param('id') id: string, @Body() dto: UpdateAppointmentStatusDto, @Request() req) {
        return this.service.updateStatus(id, req.tenant.id, dto.status, req.user.id);
    }
}
