import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './public.decorator';
import { LoginDto } from './dto/login.dto'; // Assurez-vous qu'il n'y a pas d'erreur de frappe ici


@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public() // ✅ Cette route est maintenant officiellement ouverte aux non-connectés
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    // Rappel : loginDto contient uniquement { email, password }
    return this.authService.login(loginDto);
  }
}

