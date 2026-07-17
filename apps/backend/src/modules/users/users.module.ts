import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from '../../core/auth/users.service';
import { PrismaService } from '../../core/prisma/prisma.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, PrismaService],
})
export class UsersModule {}
