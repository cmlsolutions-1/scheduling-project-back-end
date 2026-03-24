import { BadRequestException, CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { UserRole } from "src/modules/user/entity/user.entity";

@Injectable()
export class TenantGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const req = context.switchToHttp().getRequest();
        const tenant = req.tenant;
        if (!tenant) throw new BadRequestException('Empresa no identificada');

        if (req.user?.role && req.user.role !== UserRole.SUPER_ADMIN) {
            if (req.user.companyId && req.user.companyId !== tenant.id) {
                throw new ForbiddenException('Empresa no coincide con la sesión activa');
            }
        }

        return true;
    }
}
