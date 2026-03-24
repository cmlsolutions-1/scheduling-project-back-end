import { Body, Controller, Get, Post, Query, Req, Request, UseGuards } from '@nestjs/common';
import { ApiCreatedWrapped, ApiOkWrapped, ApiOkWrappedArray } from '../common/decorators/swagger/api-wrapped-response.decorator';
import { ApiCommonErrors } from '../common/decorators/swagger/api-helper-errors';
import { LoginDto } from './dto/login.dto';
import { LocalAuthGuard } from './guards/local/local.guard';
import { ResponseLoginDto } from './dto/response-login.dto';
import { JwtAuthGuard } from './guards/jwt/jwt.guard';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RefreshTokenGuard } from './guards/refresh/refresh.guard';
import { RefreshDto } from './dto/refresh.dto';
import { TenantGuard } from '../tenant/guards/tenant.guard';

@Controller('auth')
export class AuthController {


    constructor(private readonly authService: AuthService) { }

    @Post('login')
    @UseGuards(TenantGuard, LocalAuthGuard)
    @ApiCreatedWrapped(ResponseLoginDto, 'Usuario logueado exitosamente')
    @ApiCommonErrors()
    login(@Body() dto: LoginDto, @Request() req) {
        return this.authService.login(req.user, { ip: req.ip, ua: req.get('User-Agent') });
    }

    @UseGuards(JwtAuthGuard)
    @Post('logout')
    @ApiBearerAuth('jwt')
    @ApiOkWrapped(Boolean, 'Sesión cerrada')
    logout(@Request() req) {
        return this.authService.logout(req.user.sessionId);
    }

    @UseGuards(RefreshTokenGuard)
    @Post('refresh')
    async refresh(@Body() dto: RefreshDto, @Req() req) {

        return this.authService.refreshSession(req.session);

    }
}
