import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { DataSource } from "typeorm";
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Session } from "src/modules/session/entity/session.entity";
import { UserStatus } from "src/modules/user/entity/user.entity";




@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        config: ConfigService,
        @InjectRepository(Session)
        private readonly sessionRepo: Repository<Session>,
        private readonly ds: DataSource,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
            ignoreExpiration: false,
        });
    }

    async validate(payload: any) {

        const session = await this.sessionRepo.findOne({
            where: { id: payload.sessionId, isActive: true },
            relations: ['user', 'user.company'] 
        });

        if (!session) throw new UnauthorizedException();
        if (session.user.status !== UserStatus.ACTIVE) throw new UnauthorizedException();

        const { password, ...safeUser } = session.user as any;

        return {
            ...safeUser,
            sessionId: session.id,
            role: session.user.role,
            companyId: (session.user as any).companyId ?? session.user.company?.id,
            tenantId: payload.tenantId ?? (session.user as any).companyId ?? session.user.company?.id,
        }
    }
}
