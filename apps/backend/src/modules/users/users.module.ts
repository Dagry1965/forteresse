import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from '../../core/auth/users.service';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { AuthModule } from '../../core/auth/auth.module';
import { RolesGuard } from '../../core/auth/roles.guard';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [UsersController],
  providers: [UsersService, RolesGuard],
})
export class UsersModule {}
