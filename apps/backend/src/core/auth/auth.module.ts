import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersService } from './users.service';
import { JwtStrategy } from './jwt.strategy';

import { JwtAuthGuard } from './jwt-auth.guard';
import { WorkspaceGuard } from './workspace.guard';

import { PrismaModule } from '../../core/prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'super-secret-key',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    UsersService,
    JwtStrategy,
    JwtAuthGuard,      // 🔥 indispensable
    WorkspaceGuard,    // 🔥 indispensable
  ],
  exports: [
    AuthService,
    JwtModule,         // 🔥 indispensable pour injecter JwtService dans AppointmentsModule
    JwtAuthGuard,      // 🔥 indispensable pour @UseGuards(JwtAuthGuard)
    WorkspaceGuard,    // 🔥 indispensable pour @UseGuards(WorkspaceGuard)
  ],
})
export class AuthModule {}
