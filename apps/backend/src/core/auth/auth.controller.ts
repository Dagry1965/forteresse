import {
  Body,
  Controller,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  AuthRequestContext,
  AuthService,
} from './auth.service';
import { Public } from './public.decorator';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private getRequestContext(req: Request): AuthRequestContext {
    const forwardedFor = req.headers['x-forwarded-for'];
    const forwardedIp = Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : forwardedFor?.split(',')[0]?.trim();

    return {
      ipAddress: forwardedIp || req.ip || null,
      userAgent: req.headers['user-agent'] ?? null,
    };
  }

  @Public()
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
  ) {
    return this.authService.login(
      loginDto,
      this.getRequestContext(req),
    );
  }

  @Public()
  @Post('refresh')
  async refresh(
    @Body() dto: RefreshTokenDto,
    @Req() req: Request,
  ) {
    return this.authService.refresh(
      dto.refresh_token,
      this.getRequestContext(req),
    );
  }

  @Public()
  @Post('logout')
  async logout(
    @Body() dto: RefreshTokenDto,
    @Req() req: Request,
  ) {
    return this.authService.logout(
      dto.refresh_token,
      this.getRequestContext(req),
    );
  }
}
