import { ResponseClientDto } from "./dto/response-client.dto";
import { Client } from "./entity/client.entity";



export class ClientMapper {
 

  static toResponse(user: Client): ResponseClientDto {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: (user as any).phone ?? null,
      status: user.status,
      documentNumber: user.documentNumber ?? null,
      address: user.address ?? null,
      birthDate: user.birthDate ?? null,
      documentType: user.documentType ?? null,
    };
  }

  static toResponseList(users: Client[]): ResponseClientDto[] {
    return users.map((u) => this.toResponse(u));
  }
}
