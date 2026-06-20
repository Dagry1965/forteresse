import { Module, Global } from '@nestjs/common';
import { AuditService } from './audit.service';
import { PrismaModule } from '../prisma/prisma.module';

@Global() // Rendre le module global évite de l'importer manuellement partout
@Module({
  imports: [PrismaModule],
  providers: [AuditService],
  exports: [AuditService], // Indispensable pour que les autres services y aient accès
})
export class AuditModule {}
