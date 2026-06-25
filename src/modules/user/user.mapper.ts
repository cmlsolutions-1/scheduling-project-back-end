import { ResponseUserDto } from "./dto/response-user.dto";
import { ResponseEmployeeServiceAssignmentDto } from "./dto/response-employee-service-assignment.dto";
import { EmployeeService } from "./entity/employee-service.entity";
import { User } from "./entity/user.entity";


export class UserMapper {
    private static toEmployeeServiceAssignmentResponse(employeeService: EmployeeService): ResponseEmployeeServiceAssignmentDto | null {
        if (!employeeService.service) {
            return null;
        }

        const baseCommissionRate = Number(employeeService.service.commissionRate ?? 0);
        const extraCommissionRate = Number(employeeService.extraCommissionRate ?? 0);

        return {
            serviceId: employeeService.serviceId ?? employeeService.service.id,
            serviceName: employeeService.service.name,
            price: Number(employeeService.service.price),
            durationMinutes: employeeService.service.durationMinutes,
            baseCommissionRate,
            extraCommissionRate,
            totalCommissionRate: Number((baseCommissionRate + extraCommissionRate).toFixed(2)),
            imageId: employeeService.service.imageId ?? employeeService.service.image?.id,
            imageUrl: employeeService.service.image?.url,
            status: employeeService.service.status,
        };
    }
 

    static toResponse(user: User): ResponseUserDto {
    const services = (user.employeeServices ?? [])
      .map((employeeService) => this.toEmployeeServiceAssignmentResponse(employeeService))
      .filter((employeeService): employeeService is ResponseEmployeeServiceAssignmentDto => !!employeeService);

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: (user as any).phone ?? null,
      status: user.status,
      companyId: (user as any).companyId ?? user.company?.id,
      imageId: (user as any).imageId ?? user.image?.id,
      imageUrl: user.image?.url,
      role: user.role,
      serviceIds: services.map((employeeService) => employeeService.serviceId),
      services,
    };
  }

  static toResponseList(users: User[]): ResponseUserDto[] {
    return users.map((u) => this.toResponse(u));
  }
}
