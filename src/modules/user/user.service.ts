import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UserRepository } from './repositories/user.repository.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {


    constructor(private readonly repository: UserRepository) { }

    async create(dto: CreateUserDto, authorId: string, tenantId?: string) {
        await this.validateFieldsCreate(dto.email!, dto.phone!, tenantId);
        return this.repository.createUser(dto, authorId, tenantId);
    }

    async findAll(tenantId?: string) {
        return await this.repository.findAll(tenantId);
    }

    async findOne(id: string, tenantId?: string) {
        return await this.repository.findById(id, tenantId);
    }

    async update(id: string, dto: UpdateUserDto, authorId: string, tenantId?: string) {
        return await this.repository.updateUser(id, dto, authorId, tenantId);
    }

    async remove(id: string, authorId: string, tenantId?: string) {
        return await this.repository.deleteUser(id, authorId, tenantId);
    }

    async active(id: string, authorId: string, tenantId?: string) {
        return await this.repository.activeUser(id, authorId, tenantId);
    }

    async findByEmail(email: string, tenantId?: string) {
        return await this.repository.findByEmail(email, tenantId);
    }

    async validateFieldsCreate(email: string, numberPhone: string, tenantId?: string) {

        if (await this.repository.validateByEmail(email, tenantId)) {
            throw new BadRequestException('El email del usuario ya esta en uso');
        }
        if (await this.repository.validateByPhone(numberPhone, tenantId)) {
            throw new BadRequestException('El numero de telefono del usuario ya esta en uso');
        }

    }
}
