import { InjectRepository } from "@nestjs/typeorm";
import { User, UserRole, UserStatus } from "../entity/user.entity";
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import * as bcrypt from 'bcrypt';
import { Not, Repository } from "typeorm";
import { ResponseUserDto } from "../dto/response-user.dto";
import { UserMapper } from "../user.mapper";

@Injectable()
export class UserRepository {
    constructor(
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
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
            where: { id: saved.id }
        });

        return UserMapper.toResponse(full ?? saved);
    }

    async findAll(tenantId?: string): Promise<ResponseUserDto[]> {
        const users = await this.userRepo.find({
            where: { status: UserStatus.ACTIVE, ...(tenantId ? { company: { id: tenantId } } : {}) },
            relations: ['company'],
        });
        return UserMapper.toResponseList(users);
    }

    async findById(id: string, tenantId?: string): Promise<ResponseUserDto> {
        const user = await this.userRepo.findOne({
            where: { id, status: UserStatus.ACTIVE, ...(tenantId ? { company: { id: tenantId } } : {}) },
            relations: ['company'],
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
            (user as any).company = null;
        } else if (companyId) {
            (user as any).company = { id: companyId } as any;
        }

        user.updatedBy = authorId;
        const saved = await this.userRepo.save(user);

        const full = await this.userRepo.findOne({
            where: { id: saved.id }
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
}
