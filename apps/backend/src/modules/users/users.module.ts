import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from '../../core/auth/users.service';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { AuthModule } from '../../core/auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
