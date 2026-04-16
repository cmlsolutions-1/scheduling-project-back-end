import { ResponseUserDto } from "./dto/response-user.dto";
import { User } from "./entity/user.entity";


export class UserMapper {
 

    static toResponse(user: User): ResponseUserDto {
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
      serviceIds: (user.employeeServices ?? []).map((employeeService) => employeeService.service?.id).filter(Boolean),
    };
  }

  static toResponseList(users: User[]): ResponseUserDto[] {
    return users.map((u) => this.toResponse(u));
  }
}
