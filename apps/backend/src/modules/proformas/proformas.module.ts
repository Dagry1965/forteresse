import { Module } from '@nestjs/common';
import { ProformasController } from './proformas.controller';
import { ProformasService } from './proformas.service';
import { AuthModule } from '../../core/auth/auth.module'; // 👈 Vérifie ce chemin !
import { PrismaModule } from '../../core/prisma/prisma.module';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [
    PrismaModule, 
    AuthModule,
    SharedModule // 👈 INDISPENSABLE pour que JwtAuthGuard fonctionne
  ],
  controllers: [ProformasController],
  providers: [ProformasService],
  exports: [ProformasService],
})
export class ProformasModule {}
