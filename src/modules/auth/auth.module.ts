import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Session } from '../session/entity/session.entity';
import { User } from '../user/entity/user.entity';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserModule } from '../user/user.module';
import { JwtStrategy } from './strategies/jwt/jwt.strategy';
import { RefreshTokenGuard } from './guards/refresh/refresh.guard';
import { LocalStrategy } from './strategies/local/local.strategy';

@Module({

  imports: [
    PassportModule,

    PassportModule.register({ defaultStrategy: 'jwt' }),
    TypeOrmModule.forFeature([Session]),
    TypeOrmModule.forFeature([User]),

    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject:[ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.get<string>('JWT_EXPIRES_IN') as any,
        },
      }),
    }),
    UserModule
  ],

  providers: [
    AuthService,
    JwtStrategy,
    RefreshTokenGuard,
    LocalStrategy
  ],
  controllers: [AuthController]
})
export class AuthModule {}
