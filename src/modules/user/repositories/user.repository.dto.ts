import { InjectRepository } from "@nestjs/typeorm";
import { User, UserRole, UserStatus } from "../entity/user.entity";
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import * as bcrypt from 'bcrypt';
import { In, Not, Repository } from "typeorm";
import { ResponseUserDto } from "../dto/response-user.dto";
import { UserMapper } from "../user.mapper";
import { ServiceItem, ServiceItemStatus } from "src/modules/service-item/entity/service-item.entity";
import { EmployeeService } from "../entity/employee-service.entity";
import { ResponseServiceItemDto } from "src/modules/service-item/dto/response-service-item.dto";
import { ServiceItemMapper } from "src/modules/service-item/service-item.mapper";

@Injectable()
export class UserRepository {
    constructor(
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
        @InjectRepository(ServiceItem)
        private readonly serviceRepo: Repository<ServiceItem>,
        @InjectRepository(EmployeeService)
        private readonly employeeServiceRepo: Repository<EmployeeService>,
    ) { }

    async createUser(data: Partial<User>, authorId: string, tenantId?: string): Promise<ResponseUserDto> {
        const { password, ...userData } = data;
        const companyData =
            userData.role === UserRole.SUPER_ADMIN || !tenantId
                ? {}
                : { company: { id: tenantId } as any };

        if (!password) {
            throw new BadRequestException('Password is required');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = this.userRepo.create({
            ...userData,
            status: UserStatus.ACTIVE,
            createdBy: authorId,
            updatedBy: authorId,
            password: hashedPassword,
            ...companyData,
        });

        const saved = await this.userRepo.save(user);

        const full = await this.userRepo.findOne({
            where: { id: saved.id },
            relations: ['company', 'employeeServices', 'employeeServices.service'],
        });

        return UserMapper.toResponse(full ?? saved);
    }

    async findAll(tenantId?: string): Promise<ResponseUserDto[]> {
        const users = await this.userRepo.find({
            where: { status: UserStatus.ACTIVE, ...(tenantId ? { company: { id: tenantId } } : {}) },
            relations: ['company', 'employeeServices', 'employeeServices.service'],
        });
        return UserMapper.toResponseList(users);
    }

    async findById(id: string, tenantId?: string): Promise<ResponseUserDto> {
        const user = await this.userRepo.findOne({
            where: { id, status: UserStatus.ACTIVE, ...(tenantId ? { company: { id: tenantId } } : {}) },
            relations: ['company', 'employeeServices', 'employeeServices.service'],
        });

        if (!user) {
            throw new NotFoundException('Usuario no encontrado');
        }

        return UserMapper.toResponse(user);
    }

    async findByEmail(email: string, tenantId?: string) {
        return this.userRepo.findOne({
            where: { email, status: UserStatus.ACTIVE, ...(tenantId ? { company: { id: tenantId } } : {}) },
            relations: ['company'],
        });
    }

    async updateUser(
        id: string,
        data: Partial<User>,
        authorId: string,
        tenantId?: string
    ): Promise<ResponseUserDto> {
        const { companyId, ...userData } = data as any;

        const user = await this.userRepo.findOne({
            where: { id, status: UserStatus.ACTIVE, ...(tenantId ? { company: { id: tenantId } } : {}) },
        });

        if (!user) throw new BadRequestException('User no encontrado');

        Object.assign(user, userData);
        if (userData.role === UserRole.SUPER_ADMIN) {
            await this.employeeServiceRepo.delete({ employee: { id: user.id } } as any);
            (user as any).company = null;
        } else if (userData.role && userData.role !== UserRole.EMPLOYEE) {
            await this.employeeServiceRepo.delete({ employee: { id: user.id } } as any);
        } else if (companyId) {
            (user as any).company = { id: companyId } as any;
        }

        user.updatedBy = authorId;
        const saved = await this.userRepo.save(user);

        const full = await this.userRepo.findOne({
            where: { id: saved.id },
            relations: ['company', 'employeeServices', 'employeeServices.service'],
        });

        return UserMapper.toResponse(full as User);
    }

    async deleteUser(id: string, authorId: string, tenantId?: string): Promise<void> {
        const user = await this.userRepo.findOne({ where: { id, status: UserStatus.ACTIVE, ...(tenantId ? { company: { id: tenantId } } : {}) } });
        if (!user) {
            throw new NotFoundException('Usuario no encontrado');
        }
        user.status = UserStatus.INACTIVE;
        user.updatedBy = authorId;
        await this.userRepo.save(user);
    }

    async activeUser(id: string, authorId: string, tenantId?: string): Promise<void> {
        const user = await this.userRepo.findOne({ where: { id, status: UserStatus.INACTIVE, ...(tenantId ? { company: { id: tenantId } } : {}) } });
        if (!user) {
            throw new NotFoundException('Usuario no encontrado');
        }
        user.status = UserStatus.ACTIVE;
        user.updatedBy = authorId;
        await this.userRepo.save(user);
    }

    async validateByEmail(email: string, tenantId?: string, excludeUserId?: string): Promise<boolean> {
        const user = await this.userRepo.findOne({
            where: {
                email,
                status: UserStatus.ACTIVE,
                ...(tenantId ? { company: { id: tenantId } } : {}),
                ...(excludeUserId ? { id: Not(excludeUserId) } : {}),
            },
        });

        return !!user;
    }

    async validateByPhone(phone: string, tenantId?: string, excludeUserId?: string): Promise<boolean> {
        const user = await this.userRepo.findOne({
            where: {
                phone,
                status: UserStatus.ACTIVE,
                ...(tenantId ? { company: { id: tenantId } } : {}),
                ...(excludeUserId ? { id: Not(excludeUserId) } : {}),
            },
        });

        return !!user;
    }

    async findEmployeeServices(id: string, tenantId?: string): Promise<ResponseServiceItemDto[]> {
        const employee = await this.getEmployeeById(id, tenantId);
        const services = (employee.employeeServices ?? [])
            .map((employeeService) => employeeService.service)
            .filter((service): service is ServiceItem => !!service && service.status === ServiceItemStatus.ACTIVE);

        return ServiceItemMapper.toResponseList(services);
    }

    async setEmployeeServices(id: string, serviceIds: string[], authorId: string, tenantId?: string): Promise<ResponseServiceItemDto[]> {
        const employee = await this.getEmployeeById(id, tenantId);
        const companyId = employee.companyId ?? employee.company?.id;

        if (!companyId) {
            throw new BadRequestException('El empleado no tiene empresa asociada');
        }

        const normalizedServiceIds = [...new Set(serviceIds)];

        if (normalizedServiceIds.length === 0) {
            await this.employeeServiceRepo.delete({ employee: { id: employee.id } } as any);
            return [];
        }

        const services = await this.serviceRepo.find({
            where: {
                id: In(normalizedServiceIds),
                status: ServiceItemStatus.ACTIVE,
                company: { id: companyId },
            },
        });

        if (services.length !== normalizedServiceIds.length) {
            throw new BadRequestException('Uno o mas servicios no existen o no pertenecen al empleado');
        }

        await this.employeeServiceRepo.delete({ employee: { id: employee.id } } as any);

        const serviceMap = new Map(services.map((service) => [service.id, service]));
        const assignments = normalizedServiceIds.map((serviceId) =>
            this.employeeServiceRepo.create({
                employee: { id: employee.id } as any,
                service: { id: serviceId } as any,
                createdBy: authorId,
                updatedBy: authorId,
            }),
        );

        await this.employeeServiceRepo.save(assignments);

        const orderedServices = normalizedServiceIds
            .map((serviceId) => serviceMap.get(serviceId))
            .filter((service): service is ServiceItem => !!service);

        return ServiceItemMapper.toResponseList(orderedServices);
    }

    private async getEmployeeById(id: string, tenantId?: string): Promise<User> {
        const employee = await this.userRepo.findOne({
            where: {
                id,
                role: UserRole.EMPLOYEE,
                status: UserStatus.ACTIVE,
                ...(tenantId ? { company: { id: tenantId } } : {}),
            },
            relations: ['company', 'employeeServices', 'employeeServices.service'],
        });

        if (!employee) {
            throw new NotFoundException('Empleado no encontrado');
        }

        return employee;
    }
}
