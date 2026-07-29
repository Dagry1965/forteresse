import { Module } from '@nestjs/common';
import { AuthModule } from '../../core/auth/auth.module';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';
import { PrismaModule } from '../../core/prisma/prisma.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ClientsController],
  providers: [ClientsService],
  exports: [ClientsService], // Utile si d'autres modules en ont besoin
})
export class ClientsModule {}