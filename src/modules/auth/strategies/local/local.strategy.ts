import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from 'passport-local'
import { AuthService } from "../../auth.service";




@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      usernameField: 'email',
      passReqToCallback: true,
    });
  }

  async validate(req: any, userId: string, password: string) {
    const tenantId = req?.tenant?.id;
    const user = await this.authService.validateUserEmail(userId, password, tenantId);

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    return user; 
  }
}
