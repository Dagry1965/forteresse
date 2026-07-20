import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { copyFile, readdir, stat, unlink } from 'fs/promises';
import { join } from 'path';
import { GoogleDriveService } from './google-drive.service';

@Injectable()
export class BackupService {
  constructor(
    private readonly googleDriveService: GoogleDriveService,
  ) {}
  private readonly logger = new Logger(BackupService.name);
  private readonly dataDir = '/data';
  private readonly databasePath = join(this.dataDir, 'dev.db');
  private readonly backupPrefix = 'dev-backup-auto-';
  private readonly retentionCount = 7;


  @Cron('0 2 * * *')
  async createDailyBackup(): Promise<void> {
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, '-');

    const backupPath = join(
      this.dataDir,
      `${this.backupPrefix}${timestamp}.db`,
    );

    try {
      await stat(this.databasePath);
      await copyFile(this.databasePath, backupPath);

      this.logger.log(`Sauvegarde créée : ${backupPath}`);

      await this.googleDriveService.uploadBackup(
        backupPath,
        `${this.backupPrefix}${timestamp}.db`,
      );

      await this.removeOldBackups();
    } catch (error) {
      this.logger.error(
        'Échec de la sauvegarde automatique',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  private async removeOldBackups(): Promise<void> {
    const files = await readdir(this.dataDir);

    const backups = files
      .filter(
        (file) =>
          file.startsWith(this.backupPrefix) &&
          file.endsWith('.db'),
      )
      .sort()
      .reverse();

    const filesToDelete = backups.slice(this.retentionCount);

    for (const file of filesToDelete) {
      await unlink(join(this.dataDir, file));
      this.logger.log(`Ancienne sauvegarde supprimée : ${file}`);
    }
  }
}



