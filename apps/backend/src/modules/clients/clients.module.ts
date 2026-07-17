import { Module } from '@nestjs/common';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';
import { PrismaModule } from '../../core/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ClientsController],
  providers: [ClientsService],
  exports: [ClientsService], // Utile si d'autres modules en ont besoin
})
export class ClientsModule {}