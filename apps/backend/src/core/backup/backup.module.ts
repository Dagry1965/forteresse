import { Module } from '@nestjs/common';
import { BackupAlertService } from './backup-alert.service';
import { BackupService } from './backup.service';
import { GoogleDriveService } from './google-drive.service';

@Module({
  providers: [
    BackupService,
    GoogleDriveService,
    BackupAlertService,
  ],
})
export class BackupModule {}
