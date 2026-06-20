import { Controller, Post, Body, Req } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('api/auth') // <-- Ajoute 'api/' ici
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('login')
  async login(@Body() body: { email: string; password: string; workspaceId?: string }) {
    return this.auth.login(body.email, body.password, body.workspaceId);
  }

  @Post('refresh')
  async refresh(@Body() body: { refreshToken: string }) {
    return this.auth.refresh(body.refreshToken);
  }

  @Post('logout')
  async logout(@Body() body: { refreshToken: string }) {
    return this.auth.logout(body.refreshToken);
  }

  @Post('me')
  async me(@Req() req: any) {
    // simple endpoint; in production protect with JwtAuthGuard
    return { user: req.user || null };
  }
}
