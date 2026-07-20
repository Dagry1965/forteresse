import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import Database from 'better-sqlite3';
import { readdir, stat, unlink } from 'fs/promises';
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

    const backupFileName =
      `${this.backupPrefix}${timestamp}.db`;

    const backupPath = join(
      this.dataDir,
      backupFileName,
    );

    let database: Database.Database | undefined;

    try {
      await stat(this.databasePath);

      database = new Database(this.databasePath, {
        readonly: true,
        fileMustExist: true,
      });

      await database.backup(backupPath);

      this.logger.log(`Sauvegarde SQLite créée : ${backupPath}`);

      this.verifyBackupIntegrity(backupPath);

      await this.googleDriveService.uploadBackup(
        backupPath,
        backupFileName,
      );

      await this.removeOldBackups();
    } catch (error) {
      this.logger.error(
        'Échec de la sauvegarde automatique',
        error instanceof Error ? error.stack : String(error),
      );

    } finally {
      database?.close();
    }
  }

  private verifyBackupIntegrity(backupPath: string): void {
    const backupDatabase = new Database(backupPath, {
      readonly: true,
      fileMustExist: true,
    });

    try {
      const result = backupDatabase
        .prepare('PRAGMA integrity_check')
        .all() as Array<{ integrity_check: string }>;

      const isValid =
        result.length === 1 &&
        result[0]?.integrity_check === 'ok';

      if (!isValid) {
        throw new Error(
          `Échec du contrôle d’intégrité : ${JSON.stringify(result)}`,
        );
      }

      this.logger.log(
        `Intégrité de la sauvegarde vérifiée : ${backupPath}`,
      );
    } finally {
      backupDatabase.close();
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

      this.logger.log(
        `Ancienne sauvegarde supprimée : ${file}`,
      );
    }
  }
}


