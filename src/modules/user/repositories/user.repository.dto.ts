import { InjectRepository } from "@nestjs/typeorm";
import { User, UserRole, UserStatus } from "../entity/user.entity";
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import * as bcrypt from 'bcrypt';
import { In, Not, Repository } from "typeorm";
import { ResponseUserDto } from "../dto/response-user.dto";
import { UserMapper } from "../user.mapper";
import { ServiceItem, ServiceItemStatus } from "src/modules/service-item/entity/service-item.entity";
import { EmployeeService } from "../entity/employee-service.entity";
import { EmployeeSchedule, EmployeeScheduleDay } from "../entity/employee-schedule.entity";
import { ResponseServiceItemDto } from "src/modules/service-item/dto/response-service-item.dto";
import { ServiceItemMapper } from "src/modules/service-item/service-item.mapper";
import { PublicEmployeeDto } from "../dto/public-employee.dto";
import { EmployeeScheduleInputDto } from "../dto/set-employee-schedules.dto";
import { ResponseEmployeeScheduleDto } from "../dto/response-employee-schedule.dto";
import { MediaService } from "src/modules/media/media.service";
import { Session } from "src/modules/session/entity/session.entity";
import { ResponsePasswordResetUserDto } from "../dto/response-password-reset-user.dto";

type UserWriteInput = Omit<Partial<User>, 'imageId'> & {
    imageId?: string | null;
};

@Injectable()
export class UserRepository {
    constructor(
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
        @InjectRepository(ServiceItem)
        private readonly serviceRepo: Repository<ServiceItem>,
        @InjectRepository(EmployeeService)
        private readonly employeeServiceRepo: Repository<EmployeeService>,
        @InjectRepository(EmployeeSchedule)
        private readonly employeeScheduleRepo: Repository<EmployeeSchedule>,
        @InjectRepository(Session)
        private readonly sessionRepo: Repository<Session>,
        private readonly mediaService: MediaService,
    ) { }

    async createUser(data: UserWriteInput, authorId: string, tenantId?: string): Promise<ResponseUserDto> {
        const { password, imageId, ...userData } = data as any;
        const targetRole = userData.role as UserRole;
        const targetCompanyId = targetRole === UserRole.SUPER_ADMIN ? undefined : tenantId;
        const companyData =
            targetRole === UserRole.SUPER_ADMIN || !targetCompanyId
                ? {}
                : { company: { id: targetCompanyId } as any };

        if (!password) {
            throw new BadRequestException('Password is required');
        }

        await this.ensureCompanyUserLimit(targetRole, targetCompanyId);

        const hashedPassword = await bcrypt.hash(password, 10);
        const image = await this.mediaService.resolveImageForCompany(
            imageId,
            targetRole === UserRole.SUPER_ADMIN ? undefined : targetCompanyId,
        );

        const user = this.userRepo.create();
        Object.assign(user, {
            ...userData,
            status: UserStatus.ACTIVE,
            createdBy: authorId,
            updatedBy: authorId,
            password: hashedPassword,
            ...(image !== undefined ? { image: image ?? null } : {}),
            ...companyData,
        });

        const saved: User = await this.userRepo.save(user);

        const full = await this.userRepo.findOne({
            where: { id: saved.id },
            relations: ['company', 'image', 'employeeServices', 'employeeServices.service'],
        });

        return UserMapper.toResponse(full ?? saved);
    }

    async findAll(tenantId?: string): Promise<ResponseUserDto[]> {
        const users = await this.userRepo.find({
            where: { status: UserStatus.ACTIVE, ...(tenantId ? { company: { id: tenantId } } : {}) },
            relations: ['company', 'image', 'employeeServices', 'employeeServices.service'],
        });
        return UserMapper.toResponseList(users);
    }

    async findPublicEmployees(tenantId: string): Promise<PublicEmployeeDto[]> {
        const employees = await this.userRepo.find({
            where: { status: UserStatus.ACTIVE, role: UserRole.EMPLOYEE, company: { id: tenantId } },
            relations: ['image', 'employeeServices', 'employeeServices.service'],
        });

        return employees.map((employee) => ({
            id: employee.id,
            name: employee.name,
            serviceIds: (employee.employeeServices ?? [])
                .map((employeeService) => employeeService.service)
                .filter((service): service is ServiceItem => !!service && service.status === ServiceItemStatus.ACTIVE)
                .map((service) => service.id)
                .filter((serviceId): serviceId is string => !!serviceId),
            imageId: (employee as any).imageId ?? employee.image?.id,
            imageUrl: employee.image?.url,
        }));
    }

    async findById(id: string, tenantId?: string): Promise<ResponseUserDto> {
        const user = await this.userRepo.findOne({
            where: { id, status: UserStatus.ACTIVE, ...(tenantId ? { company: { id: tenantId } } : {}) },
            relations: ['company', 'image', 'employeeServices', 'employeeServices.service'],
        });

        if (!user) {
            throw new NotFoundException('Usuario no encontrado');
        }

        return UserMapper.toResponse(user);
    }

    async findByEmail(email: string, tenantId?: string) {
        return this.userRepo.findOne({
            where: { email, status: UserStatus.ACTIVE, ...(tenantId ? { company: { id: tenantId } } : {}) },
            relations: ['company', 'image'],
        });
    }

    async findForPasswordReset(email: string, tenantId?: string): Promise<ResponsePasswordResetUserDto[]> {
        const users = await this.userRepo.find({
            where: {
                email,
                status: UserStatus.ACTIVE,
                ...(tenantId ? { company: { id: tenantId }, role: UserRole.EMPLOYEE } : {}),
            },
            relations: ['company'],
            order: { name: 'ASC' },
        });

        return users.map((user) => this.toPasswordResetUserResponse(user));
    }

    async resetPassword(
        id: string,
        password: string,
        authorId: string,
        tenantId?: string,
    ): Promise<ResponsePasswordResetUserDto> {
        const user = await this.userRepo.findOne({
            where: { id, status: UserStatus.ACTIVE, ...(tenantId ? { company: { id: tenantId } } : {}) },
            relations: ['company'],
        });

        if (!user) {
            throw new NotFoundException('Usuario no encontrado');
        }

        if (tenantId && user.role !== UserRole.EMPLOYEE) {
            throw new BadRequestException('Solo puede restablecer la contrasena de empleados');
        }

        user.password = await bcrypt.hash(password, 10);
        user.updatedBy = authorId;
        await this.userRepo.save(user);

        await this.invalidateUserSessions(user.id, authorId);

        return this.toPasswordResetUserResponse(user);
    }

    async updateUser(
        id: string,
        data: UserWriteInput,
        authorId: string,
        tenantId?: string
    ): Promise<ResponseUserDto> {
        const { companyId, imageId, password, ...userData } = data as any;

        const user = await this.userRepo.findOne({
            where: { id, status: UserStatus.ACTIVE, ...(tenantId ? { company: { id: tenantId } } : {}) },
            relations: ['company'],
        });

        if (!user) throw new BadRequestException('User no encontrado');

        if (tenantId && user.role !== UserRole.EMPLOYEE) {
            throw new BadRequestException('Solo puede actualizar empleados');
        }

        if (tenantId && userData.role && userData.role !== UserRole.EMPLOYEE) {
            throw new BadRequestException('Solo puede actualizar empleados');
        }

        const nextRole = (userData.role ?? user.role) as UserRole;
        const nextCompanyId = nextRole === UserRole.SUPER_ADMIN
            ? undefined
            : companyId ?? user.companyId ?? user.company?.id;

        await this.ensureCompanyUserLimit(nextRole, nextCompanyId, user.id);

        Object.assign(user, userData);
        if (userData.role === UserRole.SUPER_ADMIN) {
            await this.employeeServiceRepo.delete({ employee: { id: user.id } } as any);
            await this.employeeScheduleRepo.delete({ employee: { id: user.id } } as any);
            (user as any).company = null;
            (user as any).image = null;
        } else {
            if (userData.role && userData.role !== UserRole.EMPLOYEE) {
                await this.employeeServiceRepo.delete({ employee: { id: user.id } } as any);
                await this.employeeScheduleRepo.delete({ employee: { id: user.id } } as any);
            }
            if (companyId) {
                (user as any).company = { id: companyId } as any;
            }
        }

        if (imageId !== undefined) {
            const effectiveCompanyId = nextRole === UserRole.SUPER_ADMIN
                ? undefined
                : companyId ?? user.companyId ?? (user as any).company?.id;
            const image = await this.mediaService.resolveImageForCompany(imageId, effectiveCompanyId);
            (user as any).image = image ?? null;
        }

        const shouldInvalidateSessions = typeof password === 'string';
        if (typeof password === 'string') {
            user.password = await bcrypt.hash(password, 10);
        }

        user.updatedBy = authorId;
        const saved: User = await this.userRepo.save(user);

        if (shouldInvalidateSessions) {
            await this.invalidateUserSessions(user.id, authorId);
        }

        const full = await this.userRepo.findOne({
            where: { id: saved.id },
            relations: ['company', 'image', 'employeeServices', 'employeeServices.service'],
        });

        return UserMapper.toResponse(full ?? saved);
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
        const user = await this.userRepo.findOne({
            where: { id, status: UserStatus.INACTIVE, ...(tenantId ? { company: { id: tenantId } } : {}) },
            relations: ['company'],
        });
        if (!user) {
            throw new NotFoundException('Usuario no encontrado');
        }
        if (tenantId && user.role !== UserRole.EMPLOYEE) {
            throw new BadRequestException('Solo puede activar empleados');
        }
        await this.ensureCompanyUserLimit(user.role, user.companyId ?? user.company?.id, user.id);
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

    async findEmployeeSchedules(id: string, tenantId?: string): Promise<ResponseEmployeeScheduleDto[]> {
        const employee = await this.getEmployeeById(id, tenantId);
        const schedules = await this.employeeScheduleRepo.find({
            where: { employee: { id: employee.id } },
            order: {
                dayOfWeek: 'ASC',
                startTime: 'ASC',
            },
        });

        return schedules.map((schedule) => this.toScheduleResponse(schedule));
    }

    async setEmployeeSchedules(
        id: string,
        schedules: EmployeeScheduleInputDto[],
        authorId: string,
        tenantId?: string,
    ): Promise<ResponseEmployeeScheduleDto[]> {
        const employee = await this.getEmployeeById(id, tenantId);
        const normalizedSchedules = this.normalizeSchedules(schedules);

        await this.employeeScheduleRepo.delete({ employee: { id: employee.id } } as any);

        if (!normalizedSchedules.length) {
            return [];
        }

        const scheduleEntities = normalizedSchedules.map((schedule) =>
            this.employeeScheduleRepo.create({
                employee: { id: employee.id } as any,
                dayOfWeek: schedule.dayOfWeek,
                startTime: schedule.startTime,
                endTime: schedule.endTime,
                createdBy: authorId,
                updatedBy: authorId,
            }),
        );

        const savedSchedules = await this.employeeScheduleRepo.save(scheduleEntities);
        return savedSchedules
            .sort((a, b) => this.compareSchedules(a, b))
            .map((schedule) => this.toScheduleResponse(schedule));
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

    private normalizeSchedules(schedules: EmployeeScheduleInputDto[]): EmployeeScheduleInputDto[] {
        const normalizedSchedules = [...schedules].sort((a, b) => this.compareScheduleInputs(a, b));

        for (let index = 0; index < normalizedSchedules.length; index++) {
            const current = normalizedSchedules[index];

            if (this.timeToMinutes(current.startTime) >= this.timeToMinutes(current.endTime)) {
                throw new BadRequestException('Cada horario debe tener endTime mayor a startTime');
            }

            if (index === 0) continue;

            const previous = normalizedSchedules[index - 1];
            if (
                previous.dayOfWeek === current.dayOfWeek &&
                this.timeToMinutes(previous.endTime) > this.timeToMinutes(current.startTime)
            ) {
                throw new BadRequestException('Los horarios del empleado no pueden solaparse en el mismo dia');
            }
        }

        return normalizedSchedules;
    }

    private compareSchedules(a: EmployeeSchedule, b: EmployeeSchedule): number {
        return this.compareScheduleInputs(a, b);
    }

    private compareScheduleInputs(
        a: { dayOfWeek: EmployeeScheduleDay; startTime: string; endTime: string },
        b: { dayOfWeek: EmployeeScheduleDay; startTime: string; endTime: string },
    ): number {
        const dayOrder = this.dayToOrder(a.dayOfWeek) - this.dayToOrder(b.dayOfWeek);
        if (dayOrder !== 0) return dayOrder;

        const startOrder = a.startTime.localeCompare(b.startTime);
        if (startOrder !== 0) return startOrder;

        return a.endTime.localeCompare(b.endTime);
    }

    private dayToOrder(dayOfWeek: EmployeeScheduleDay): number {
        const dayOrder: Record<EmployeeScheduleDay, number> = {
            [EmployeeScheduleDay.MONDAY]: 1,
            [EmployeeScheduleDay.TUESDAY]: 2,
            [EmployeeScheduleDay.WEDNESDAY]: 3,
            [EmployeeScheduleDay.THURSDAY]: 4,
            [EmployeeScheduleDay.FRIDAY]: 5,
            [EmployeeScheduleDay.SATURDAY]: 6,
            [EmployeeScheduleDay.SUNDAY]: 7,
        };

        return dayOrder[dayOfWeek];
    }

    private timeToMinutes(value: string): number {
        const [hours, minutes] = value.split(':').map(Number);
        return hours * 60 + minutes;
    }

    private toScheduleResponse(schedule: EmployeeSchedule): ResponseEmployeeScheduleDto {
        return {
            id: schedule.id,
            dayOfWeek: schedule.dayOfWeek,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
        };
    }

    private toPasswordResetUserResponse(user: User): ResponsePasswordResetUserDto {
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone ?? null,
            role: user.role,
            status: user.status,
            companyId: user.companyId ?? user.company?.id,
            companyName: user.company?.name,
        };
    }

    private async ensureCompanyUserLimit(role?: UserRole, companyId?: string, excludeUserId?: string): Promise<void> {
        if (!role || role === UserRole.SUPER_ADMIN) {
            return;
        }

        if (!companyId) {
            throw new BadRequestException('companyId es requerido');
        }

        if (role === UserRole.ADMIN) {
            const adminCount = await this.countActiveUsersByRole(companyId, UserRole.ADMIN, excludeUserId);
            if (adminCount >= 1) {
                throw new BadRequestException('Ya existe un administrador activo para esta empresa');
            }
            return;
        }

        if (role === UserRole.EMPLOYEE) {
            const employeeCount = await this.countActiveUsersByRole(companyId, UserRole.EMPLOYEE, excludeUserId);
            if (employeeCount >= 6) {
                throw new BadRequestException('La empresa ya tiene el limite de 6 empleados activos');
            }
        }
    }

    private async countActiveUsersByRole(companyId: string, role: UserRole, excludeUserId?: string): Promise<number> {
        return this.userRepo.count({
            where: {
                status: UserStatus.ACTIVE,
                role,
                company: { id: companyId },
                ...(excludeUserId ? { id: Not(excludeUserId) } : {}),
            },
        });
    }

    private async invalidateUserSessions(userId: string, authorId: string): Promise<void> {
        await this.sessionRepo.createQueryBuilder()
            .update(Session)
            .set({
                isActive: false,
                refreshTokenHash: null,
                refreshTokenExpiresAt: null,
                updatedBy: authorId,
            })
            .where('"userId" = :userId', { userId })
            .execute();
    }
}
