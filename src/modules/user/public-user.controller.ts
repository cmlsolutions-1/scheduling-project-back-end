import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { ApiCommonErrors } from '../common/decorators/swagger/api-helper-errors';
import { ApiOkWrappedArray } from '../common/decorators/swagger/api-wrapped-response.decorator';
import { TenantGuard } from '../tenant/guards/tenant.guard';
import { PublicEmployeeDto } from './dto/public-employee.dto';
import { UserService } from './user.service';

@Controller('user')
export class PublicUserController {
    constructor(private readonly service: UserService) { }

    @Get('public/employees')
    @UseGuards(TenantGuard)
    @ApiOkWrappedArray(PublicEmployeeDto, 'Empleados publicos')
    @ApiCommonErrors()
    findPublicEmployees(@Request() req) {
        return this.service.findPublicEmployees(req.tenant.id);
    }
}
