import { Injectable } from '@nestjs/common';
import { ClientRepository } from './repositories/client.repository.dto';
import { CreateClientDto } from './dto/create-client.dto';


@Injectable()
export class ClientService {

    constructor(private readonly repository: ClientRepository) { }

    async create(dto: CreateClientDto, tenantId: string) {
        return this.repository.upsertByDocumentNumber(dto, tenantId);
    }

    async findAll(tenantId: string) {
        return await this.repository.findAll(tenantId);
    }

    async findOne(id: string, tenantId: string) {
        return await this.repository.findById(id, tenantId);
    }

    async update(id: string, dto: CreateClientDto, tenantId: string) {
        return await this.repository.updateUser(id, dto, tenantId);
    }

    async remove(id: string, tenantId: string) {
        return await this.repository.deleteUser(id, tenantId);
    }

    async active(id: string, tenantId: string) {
        return await this.repository.activeUser(id, tenantId);
    }

    async findByEmail(email: string, tenantId: string) {
        return await this.repository.findByEmail(email, tenantId);
    }

}
