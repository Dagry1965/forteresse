import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { DOCUMENT_CONFIG, DocumentType } from '../../../../../shared/constants/status.constants';

@Injectable()
export class SequencingService {
  constructor(private prisma: PrismaService) {}

  async generateReference(workspaceId: string, docType: DocumentType): Promise<string> {
    const year = new Date().getFullYear();
    const config = DOCUMENT_CONFIG[docType];

    const sequence = await this.prisma.numberSequence.upsert({
      where: {
        workspace_id_prefix_year: { // Correction : prefix selon votre schéma
          workspace_id: workspaceId,
          prefix: config.code,
          year: year,
        },
      },
      update: { last_number: { increment: 1 } },
      create: {
        workspace_id: workspaceId,
        prefix: config.code,
        year: year,
        last_number: 1,
      },
    });

    const formattedNumber = sequence.last_number.toString().padStart(4, '0');
    return `${config.code}-${year}-${formattedNumber}`;
  }
}
