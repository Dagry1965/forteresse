import { Injectable, Logger } from '@nestjs/common';
import { createReadStream } from 'fs';
import { google } from 'googleapis';

@Injectable()
export class GoogleDriveService {
  private readonly logger = new Logger(GoogleDriveService.name);
  private readonly folderName = 'AMARKHYS Backups';
  private readonly retentionCount = 30;

  async uploadBackup(filePath: string, fileName: string): Promise<void> {
    const tokenBase64 = process.env.GOOGLE_DRIVE_TOKEN_BASE64;

    if (!tokenBase64) {
      this.logger.warn(
        'GOOGLE_DRIVE_TOKEN_BASE64 absent : sauvegarde Drive ignorée.',
      );
      return;
    }

    const credentials = JSON.parse(
      Buffer.from(tokenBase64, 'base64').toString('utf8'),
    );

    const auth = new google.auth.OAuth2(
      credentials.client_id,
      credentials.client_secret,
    );

    auth.setCredentials({
      refresh_token: credentials.refresh_token,
    });
    const drive = google.drive({ version: 'v3', auth });

    const folderId = await this.getOrCreateFolder(drive);

    const response = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: [folderId],
      },
      media: {
        mimeType: 'application/x-sqlite3',
        body: createReadStream(filePath),
      },
      fields: 'id,name',
    });

    this.logger.log(
      `Sauvegarde envoyée sur Google Drive : ${response.data.name}`,
    );

    await this.removeOldBackups(drive, folderId);
  }

  private async removeOldBackups(
    drive: ReturnType<typeof google.drive>,
    folderId: string,
  ): Promise<void> {
    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'files(id,name,createdTime)',
      orderBy: 'createdTime desc',
      pageSize: 1000,
    });

    const backups = response.data.files ?? [];
    const filesToDelete = backups.slice(this.retentionCount);

    for (const file of filesToDelete) {
      if (!file.id) {
        continue;
      }

      await drive.files.delete({
        fileId: file.id,
      });

      this.logger.log(
        `Ancienne sauvegarde Google Drive supprimée : ${file.name}`,
      );
    }
  }

  private async getOrCreateFolder(
    drive: ReturnType<typeof google.drive>,
  ): Promise<string> {
    const escapedName = this.folderName.replace(/'/g, "\\'");

    const existingFolders = await drive.files.list({
      q: [
        `name = '${escapedName}'`,
        `mimeType = 'application/vnd.google-apps.folder'`,
        'trashed = false',
      ].join(' and '),
      fields: 'files(id,name)',
      spaces: 'drive',
    });

    const existingFolder = existingFolders.data.files?.[0];

    if (existingFolder?.id) {
      return existingFolder.id;
    }

    const createdFolder = await drive.files.create({
      requestBody: {
        name: this.folderName,
        mimeType: 'application/vnd.google-apps.folder',
      },
      fields: 'id',
    });

    if (!createdFolder.data.id) {
      throw new Error('Google Drive n’a pas retourné l’identifiant du dossier.');
    }

    return createdFolder.data.id;
  }
}


