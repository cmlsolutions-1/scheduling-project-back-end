import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Client, ClientStatus } from "../entity/client.entity";
import { Not, Repository } from "typeorm";



@Injectable()
export class ClientRepository {

    constructor(

        @InjectRepository(Client)
        private readonly clientRepo: Repository<Client>,
    ) { }

    async createUser(data: Partial<Client>, tenantId: string): Promise<Client> {
        const {  ...userData } = data;

        const client = this.clientRepo.create({
            ...userData,
            status: ClientStatus.ACTIVE,
            company: { id: tenantId } as any,
        });

        const saved = await this.clientRepo.save(client);
        const full = await this.clientRepo.findOne({
            where: { id: saved.id }
        });

        return  full ?? saved;
    }

    async findAll(tenantId: string): Promise<Client[]> {

        const clients = await this.clientRepo.find({
            where: { status: ClientStatus.ACTIVE, company: { id: tenantId } }
        });
        return clients;
    }

    async findById(id: string, tenantId: string): Promise<Client> {

        const client = await this.clientRepo.findOne({
            where: { id, status: ClientStatus.ACTIVE, company: { id: tenantId } }
        });

        if (!client) {
            throw new NotFoundException('Cliente no encontrado');
        }

        return client;
    }

    async findByEmail(email: string, tenantId: string) {
        return this.clientRepo.findOne({
            where: { email, status: ClientStatus.ACTIVE, company: { id: tenantId } },
        });
    }

    async findByDocumentNumber(documentNumber: string, tenantId: string) {
        return this.clientRepo.findOne({
            where: { documentNumber, status: ClientStatus.ACTIVE, company: { id: tenantId } },
        });
    }

    async findAnyByDocumentNumber(documentNumber: string, tenantId: string) {
        return this.clientRepo.findOne({
            where: { documentNumber, company: { id: tenantId } },
        });
    }

    async upsertByDocumentNumber(data: Partial<Client>, tenantId: string): Promise<Client> {
        const client = await this.findAnyByDocumentNumber(data.documentNumber!, tenantId);

        if (client) {
            Object.assign(client, data, {
                status: ClientStatus.ACTIVE,
            });

            const saved = await this.clientRepo.save(client);
            const full = await this.clientRepo.findOne({
                where: { id: saved.id }
            });

            return full ?? saved;
        }

        return this.createUser(data, tenantId);
    }

    async updateByDocumentNumber(
        documentNumber: string,
        data: Partial<Client>,
        tenantId: string
    ): Promise<Client> {
        const client = await this.findByDocumentNumber(documentNumber, tenantId);
        if (!client) throw new BadRequestException('Client no encontrado');

        Object.assign(client, data);

        const saved = await this.clientRepo.save(client);
        const full = await this.clientRepo.findOne({
            where: { id: saved.id }
        });

        return full ?? saved;
    }

    async updateUser(
        id: string,
        data: Partial<Client>,
        tenantId: string
    ): Promise<Client> {
        const { ...userData } = data;

        const client = await this.clientRepo.findOne({
            where: { id, status: ClientStatus.ACTIVE, company: { id: tenantId } },
        });

        if (!client) throw new BadRequestException('Client no encontrado');

        Object.assign(client, userData);

        const saved = await this.clientRepo.save(client);

        const full = await this.clientRepo.findOne({
            where: { id: saved.id }
        });

        return full ?? saved;

    }

    async deleteUser(id: string, tenantId: string): Promise<void> {

        const client = await this.clientRepo.findOne({ where: { id, status: ClientStatus.ACTIVE, company: { id: tenantId } } });
        if (!client) {
            throw new NotFoundException('Cliente no encontrado');
        }
        client.status = ClientStatus.INACTIVE;
        await this.clientRepo.save(client);
    }

    async activeUser(id: string, tenantId: string): Promise<void> {

        const client = await this.clientRepo.findOne({ where: { id, status: ClientStatus.INACTIVE, company: { id: tenantId } } });
        if (!client) {
            throw new NotFoundException('Cliente no encontrado');
        }
        client.status = ClientStatus.ACTIVE;
        await this.clientRepo.save(client);
    }

    async validateByEmail(email: string, tenantId: string, excludeUserId?: string): Promise<boolean> {
        const client = await this.clientRepo.findOne({
            where: {
                email,
                status: ClientStatus.ACTIVE,
                company: { id: tenantId },
                ...(excludeUserId ? { id: Not(excludeUserId) } : {}),
            },
        });

        return !!client;
    }

    async validateByDocumentNumber(documentNumber: string, tenantId: string, excludeUserId?: string): Promise<boolean> {
        const client = await this.clientRepo.findOne({
            where: {
                documentNumber,
                status: ClientStatus.ACTIVE,
                company: { id: tenantId },
                ...(excludeUserId ? { id: Not(excludeUserId) } : {}),
            },
        });

        return !!client;
    }
}
