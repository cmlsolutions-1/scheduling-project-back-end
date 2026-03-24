import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm/dist/common/typeorm.decorators";
import { createHash } from "crypto";
import { Session } from "src/modules/session/entity/session.entity";
import { Repository } from "typeorm";



@Injectable()
export class RefreshTokenGuard implements CanActivate {
    constructor(
        @InjectRepository(Session)
        private readonly sessionRepo: Repository<Session>,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const req = context.switchToHttp().getRequest();

        const refreshToken: string | undefined =
            req.body?.refreshToken || req.cookies?.refreshToken;

        if (!refreshToken) throw new UnauthorizedException('Missing refresh token');

        const tokenHash = hashToken(refreshToken);

        const session = await this.sessionRepo.findOne({
            where: { refreshTokenHash: tokenHash, isActive: true },
            relations: ['user', 'user.company'],
        });

        if (!session) throw new UnauthorizedException('Invalid refresh token');

        if (session.refreshTokenExpiresAt && session.refreshTokenExpiresAt < new Date()) {
            session.isActive = false;
            session.refreshTokenHash = null;
            session.refreshTokenExpiresAt = null;
            await this.sessionRepo.save(session);

            throw new UnauthorizedException('Refresh token expired');
        }

        req.session = session;
        const { password, ...safeUser } = session.user as any;
        req.user = {
            ...safeUser,
            sessionId: session.id,
            role: session.user.role,
            companyId: (session.user as any).companyId ?? session.user.company?.id,
        };

        return true;
    }
}

function hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
}
