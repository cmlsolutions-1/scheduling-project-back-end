import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Session } from '../session/entity/session.entity';
import { User, UserRole, UserStatus } from '../user/entity/user.entity';
import { randomBytes, createHash } from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ResponseLoginDto } from './dto/response-login.dto';

@Injectable()
export class AuthService {
    constructor(
        private readonly jwtService: JwtService,
        @InjectRepository(Session)
        private readonly sessionRepo: Repository<Session>,
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
    ) { }

    async validateUserEmail(email: string, password: string, tenantId?: string): Promise<User> {
        const select = {
            id: true,
            name: true,
            email: true,
            phone: true,
            password: true,
            status: true,
            role: true,
        } as any;

        const tenantUsers = tenantId
            ? await this.userRepo.find({
                where: { email, status: UserStatus.ACTIVE, company: { id: tenantId } },
                select,
                relations: ['company'],
            })
            : [];

        const superAdmins = await this.userRepo.find({
            where: { email, status: UserStatus.ACTIVE, role: UserRole.SUPER_ADMIN },
            select,
            relations: ['company'],
        });

        const candidates = [...tenantUsers];
        for (const superAdmin of superAdmins) {
            if (!candidates.some((candidate) => candidate.id === superAdmin.id)) {
                candidates.push(superAdmin);
            }
        }

        for (const user of candidates) {
            const isValid = await bcrypt.compare(password, user.password);
            if (isValid) {
                return user;
            }
        }

        throw new UnauthorizedException('Credenciales invalidas');
    }

    async login(user: User, meta?: { ip?: string; ua?: string }): Promise<ResponseLoginDto> {
        const session = await this.sessionRepo.save(
            this.sessionRepo.create({
                user,
                isActive: true,
                ipAddress: meta?.ip,
                userAgent: meta?.ua,
                createdBy: user.id,
                updatedBy: user.id,
            }),
        );

        const payload = {
            sub: user.id,
            role: user.role,
            sessionId: session.id,
            tenantId: (user as any).companyId ?? user.company?.id,
        };

        const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });

        const refreshToken = generateRefreshToken();
        session.refreshTokenHash = hashToken(refreshToken);
        session.refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        await this.sessionRepo.save(session);

        return convertLoginResponseToDto({ accessToken, refreshToken });
    }

    async refreshSession(session: Session) {
        const payload = {
            sub: session.user.id,
            role: session.user.role,
            sessionId: session.id,
            tenantId: (session.user as any).companyId ?? session.user.company?.id,
        };

        const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });

        const newRefreshToken = generateRefreshToken();
        session.refreshTokenHash = hashToken(newRefreshToken);
        session.refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        session.lastRefreshAt = new Date();

        await this.sessionRepo.save(session);

        return convertLoginResponseToDto({ accessToken, refreshToken: newRefreshToken });
    }

    async logout(sessionId: string) {
        await this.sessionRepo.update(
            { id: sessionId },
            { isActive: false, refreshTokenHash: null, refreshTokenExpiresAt: null },
        );
    }
}

function generateRefreshToken(): string {
    return randomBytes(64).toString('hex');
}

function hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
}

function convertLoginResponseToDto(dto: any) {
    const responseDeto = new ResponseLoginDto();
    responseDeto.accesToken = dto.accessToken;
    responseDeto.refreshToken = dto.refreshToken;
    return responseDeto;
}
