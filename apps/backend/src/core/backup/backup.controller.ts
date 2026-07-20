import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { PrismaService } from '../prisma/prisma.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('backups')
export class BackupController {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  findAll(@Query('limit') limit?: string) {
    const parsedLimit = Number(limit);
    const take =
      Number.isInteger(parsedLimit) &&
      parsedLimit > 0 &&
      parsedLimit <= 100
        ? parsedLimit
        : 30;

    return this.prisma.backupLog.findMany({
      orderBy: {
        created_at: 'desc',
      },
      take,
    });
  }
}
