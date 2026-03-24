import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorators';
import { JwtAuthGuard } from '../auth/guards/jwt/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ApiCommonErrors } from '../common/decorators/swagger/api-helper-errors';
import { ApiOkWrapped } from '../common/decorators/swagger/api-wrapped-response.decorator';
import { TenantGuard } from '../tenant/guards/tenant.guard';
import { AdminDashboardDto } from './dto/admin-dashboard.dto';
import { EmployeeDashboardDto } from './dto/employee-dashboard.dto';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
@ApiBearerAuth('jwt')
export class DashboardController {
    constructor(private readonly service: DashboardService) {}

    @Get('admin')
    @ApiOkWrapped(AdminDashboardDto, 'Panel administrativo')
    @ApiCommonErrors()
    @Roles('ADMIN')
    getAdmin(@Request() req) {
        return this.service.getAdminDashboard(req.tenant.id);
    }

    @Get('employee')
    @ApiOkWrapped(EmployeeDashboardDto, 'Panel del empleado')
    @ApiCommonErrors()
    @Roles('EMPLOYEE')
    getEmployee(@Request() req) {
        return this.service.getEmployeeDashboard(req.tenant.id, req.user.id);
    }
}
