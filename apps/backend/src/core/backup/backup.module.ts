import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RolesGuard } from '../auth/roles.guard';
import { BackupController } from './backup.controller';
import { BackupService } from './backup.service';
import { GoogleDriveService } from './google-drive.service';

@Module({
  imports: [
    AuthModule,
  ],
  controllers: [
    BackupController,
  ],
  providers: [
    BackupService,
    GoogleDriveService,
    RolesGuard,
  ],
})
export class BackupModule {}
