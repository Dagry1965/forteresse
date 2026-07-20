import { Injectable, Logger } from '@nestjs/common';
import { createReadStream } from 'fs';
import { google } from 'googleapis';

@Injectable()
export class GoogleDriveService {
  private readonly logger = new Logger(GoogleDriveService.name);
  private readonly folderName = 'AMARKHYS Backups';

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

