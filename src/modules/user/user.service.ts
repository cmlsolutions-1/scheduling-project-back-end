import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UserRepository } from './repositories/user.repository.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResponseServiceItemDto } from '../service-item/dto/response-service-item.dto';
import { PublicEmployeeDto } from './dto/public-employee.dto';
import { EmployeeScheduleInputDto } from './dto/set-employee-schedules.dto';
import { ResponseEmployeeScheduleDto } from './dto/response-employee-schedule.dto';
import { ResponsePasswordResetUserDto } from './dto/response-password-reset-user.dto';

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

    async findPublicEmployees(tenantId: string): Promise<PublicEmployeeDto[]> {
        return await this.repository.findPublicEmployees(tenantId);
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

    async findServices(id: string, tenantId?: string): Promise<ResponseServiceItemDto[]> {
        return await this.repository.findEmployeeServices(id, tenantId);
    }

    async setServices(id: string, serviceIds: string[], authorId: string, tenantId?: string): Promise<ResponseServiceItemDto[]> {
        return await this.repository.setEmployeeServices(id, serviceIds, authorId, tenantId);
    }

    async findSchedules(id: string, tenantId?: string): Promise<ResponseEmployeeScheduleDto[]> {
        return await this.repository.findEmployeeSchedules(id, tenantId);
    }

    async setSchedules(id: string, schedules: EmployeeScheduleInputDto[], authorId: string, tenantId?: string): Promise<ResponseEmployeeScheduleDto[]> {
        return await this.repository.setEmployeeSchedules(id, schedules, authorId, tenantId);
    }

    async findByEmail(email: string, tenantId?: string) {
        return await this.repository.findByEmail(email, tenantId);
    }

    async findForPasswordReset(email: string, tenantId?: string): Promise<ResponsePasswordResetUserDto[]> {
        return await this.repository.findForPasswordReset(email, tenantId);
    }

    async resetPassword(id: string, password: string, authorId: string, tenantId?: string): Promise<ResponsePasswordResetUserDto> {
        return await this.repository.resetPassword(id, password, authorId, tenantId);
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
