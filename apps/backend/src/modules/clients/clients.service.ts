import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Client } from '@prisma/client';
import { PrismaService } from '../../core/prisma/prisma.service';
import { NormalizationService } from '../shared/normalization.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { CreateClientContactDto } from './dto/create-client-contact.dto';
import { UpdateClientContactDto } from './dto/update-client-contact.dto';
import { INVOICE_STATUS } from '../../../../../shared/constants/status.constants';

@Injectable()
export class ClientsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly normalization: NormalizationService,
  ) {}

  private async findClient(
    workspaceId: string,
    id: string,
    includeArchived: boolean,
  ) {
    const client = await this.prisma.client.findFirst({
      where: {
        id,
        workspace_id: workspaceId,
        ...(includeArchived ? {} : { deleted_at: null }),
      },
    });

    if (!client) {
      throw new NotFoundException('Client introuvable');
    }

    return client;
  }

  private async assertUniqueIdentity(
    workspaceId: string,
    emailNormalized: string | null,
    phoneNormalized: string | null,
    excludeId?: string,
  ) {
    if (emailNormalized) {
      const existingEmail = await this.prisma.client.findFirst({
        where: {
          workspace_id: workspaceId,
          email_normalized: emailNormalized,
          ...(excludeId ? { id: { not: excludeId } } : {}),
        },
        select: {
          id: true,
          deleted_at: true,
        },
      });

      if (existingEmail) {
        const archiveMessage = existingEmail.deleted_at
          ? ' Un client archive utilise deja cette adresse.'
          : '';

        throw new BadRequestException(
          `Un client avec l adresse email "${emailNormalized}" existe deja dans ce workspace.${archiveMessage}`,
        );
      }
    }

    if (phoneNormalized) {
      const existingPhone = await this.prisma.client.findFirst({
        where: {
          workspace_id: workspaceId,
          phone_normalized: phoneNormalized,
          ...(excludeId ? { id: { not: excludeId } } : {}),
        },
        select: {
          id: true,
          deleted_at: true,
        },
      });

      if (existingPhone) {
        const archiveMessage = existingPhone.deleted_at
          ? ' Un client archive utilise deja ce numero.'
          : '';

        throw new BadRequestException(
          `Un client avec le numero "${phoneNormalized}" existe deja dans ce workspace.${archiveMessage}`,
        );
      }
    }
  }

  private mapPrismaUniqueError(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new BadRequestException(
        'Un client avec le meme email ou telephone existe deja dans ce workspace.',
      );
    }

    throw error;
  }

  async findAll(workspaceId: string) {
    if (!workspaceId) {
      throw new BadRequestException('workspaceId est requis');
    }

    return this.prisma.client.findMany({
      where: {
        workspace_id: workspaceId,
        deleted_at: null,
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  async findOne(workspaceId: string, id: string) {
    const client = await this.prisma.client.findFirst({
      where: {
        id,
        workspace_id: workspaceId,
        deleted_at: null,
      },
      include: {
        contacts: {
          where: {
            deleted_at: null,
          },
          orderBy: [
            {
              is_primary: 'desc',
            },
            {
              created_at: 'asc',
            },
          ],
        },
        vehicles: {
          where: {
            deleted_at: null,
          },
          orderBy: {
            created_at: 'desc',
          },
        },
        appointments: {
          where: {
            deleted_at: null,
          },
          include: {
            vehicle: true,
          },
          orderBy: {
            date: 'desc',
          },
        },
        cases: {
          include: {
            vehicle: true,
            interventions: {
              where: {
                deleted_at: null,
              },
            },
            proformas: {
              where: {
                deleted_at: null,
              },
              orderBy: {
                created_at: 'desc',
              },
            },
          },
          orderBy: {
            created_at: 'desc',
          },
        },
        invoices: {
          where: {
            deleted_at: null,
          },
          include: {
            payments: true,
            paymentSchedules: true,
          },
          orderBy: {
            created_at: 'desc',
          },
        },
        payments: {
          where: {
            deleted_at: null,
          },
          orderBy: {
            created_at: 'desc',
          },
        },
      },
    });

    if (!client) {
      throw new NotFoundException('Client introuvable');
    }

    return client;
  }

  async create(workspaceId: string, dto: CreateClientDto) {
    if (!workspaceId) {
      throw new BadRequestException('workspaceId est requis');
    }

    const name = dto.name.trim();

    if (!name) {
      throw new BadRequestException('Le nom du client est requis');
    }

    const emailNormalized = this.normalization.normalizeEmail(dto.email);
    const phoneNormalized = this.normalization.normalizePhone(dto.phone);

    await this.assertUniqueIdentity(
      workspaceId,
      emailNormalized,
      phoneNormalized,
    );

    try {
      return await this.prisma.client.create({
        data: {
          workspace_id: workspaceId,
          name,
          phone: phoneNormalized ?? '',
          phone_normalized: phoneNormalized,
          email: emailNormalized ?? '',
          email_normalized: emailNormalized,
          type: dto.type ?? 'INDIVIDUAL',
          company_name: dto.company_name?.trim() || null,
          trade_name: dto.trade_name?.trim() || null,
          registration_number:
            dto.registration_number?.trim().toUpperCase() || null,
          vat_number: dto.vat_number?.trim().toUpperCase() || null,
          address: dto.address?.trim() || null,
          billing_address: dto.billing_address?.trim() || null,
          payment_terms_days: dto.payment_terms_days ?? 0,
          credit_limit: dto.credit_limit ?? null,
        },
      });
    } catch (error) {
      this.mapPrismaUniqueError(error);
    }
  }

  async update(
    workspaceId: string,
    id: string,
    dto: UpdateClientDto,
  ) {
    const client = await this.findClient(workspaceId, id, false);

    const emailNormalized =
      dto.email !== undefined
        ? this.normalization.normalizeEmail(dto.email)
        : client.email_normalized;

    const phoneNormalized =
      dto.phone !== undefined
        ? this.normalization.normalizePhone(dto.phone)
        : client.phone_normalized;

    await this.assertUniqueIdentity(
      workspaceId,
      emailNormalized,
      phoneNormalized,
      id,
    );

    if (dto.name !== undefined && !dto.name.trim()) {
      throw new BadRequestException('Le nom du client est requis');
    }

    try {
      return await this.prisma.client.update({
        where: {
          id,
        },
        data: {
          ...(dto.name !== undefined
            ? {
                name: dto.name.trim(),
              }
            : {}),
          ...(dto.phone !== undefined
            ? {
                phone: phoneNormalized ?? '',
                phone_normalized: phoneNormalized,
              }
            : {}),
          ...(dto.email !== undefined
            ? {
                email: emailNormalized ?? '',
                email_normalized: emailNormalized,
              }
            : {}),
          ...(dto.type !== undefined
            ? {
                type: dto.type,
              }
            : {}),
          ...(dto.company_name !== undefined
            ? {
                company_name: dto.company_name.trim() || null,
              }
            : {}),
          ...(dto.trade_name !== undefined
            ? {
                trade_name: dto.trade_name.trim() || null,
              }
            : {}),
          ...(dto.registration_number !== undefined
            ? {
                registration_number:
                  dto.registration_number.trim().toUpperCase() || null,
              }
            : {}),
          ...(dto.vat_number !== undefined
            ? {
                vat_number: dto.vat_number.trim().toUpperCase() || null,
              }
            : {}),
          ...(dto.address !== undefined
            ? {
                address: dto.address.trim() || null,
              }
            : {}),
          ...(dto.billing_address !== undefined
            ? {
                billing_address: dto.billing_address.trim() || null,
              }
            : {}),
          ...(dto.payment_terms_days !== undefined
            ? {
                payment_terms_days: dto.payment_terms_days,
              }
            : {}),
          ...(dto.credit_limit !== undefined
            ? {
                credit_limit: dto.credit_limit,
              }
            : {}),
        },
      });
    } catch (error) {
      this.mapPrismaUniqueError(error);
    }
  }

  async softDelete(workspaceId: string, id: string) {
    await this.findClient(workspaceId, id, false);

    const vehicleCount = await this.prisma.vehicle.count({
      where: {
        workspace_id: workspaceId,
        client_id: id,
        deleted_at: null,
      },
    });

    if (vehicleCount > 0) {
      throw new BadRequestException(
        `Impossible d archiver ce client : il possede encore ${vehicleCount} vehicule(s) actif(s).`,
      );
    }

    const unpaidInvoicesCount = await this.prisma.invoice.count({
      where: {
        workspace_id: workspaceId,
        client_id: id,
        deleted_at: null,
        status: {
          notIn: [
            INVOICE_STATUS.PAID,
            INVOICE_STATUS.CANCELLED,
          ],
        },
      },
    });

    if (unpaidInvoicesCount > 0) {
      throw new BadRequestException(
        `Impossible d archiver ce client : il a encore ${unpaidInvoicesCount} facture(s) ouverte(s).`,
      );
    }

    return this.prisma.client.update({
      where: {
        id,
      },
      data: {
        deleted_at: new Date(),
      },
    });
  }

  async restore(workspaceId: string, id: string) {
    const client = await this.findClient(workspaceId, id, true);

    if (!client.deleted_at) {
      throw new BadRequestException('Ce client est deja actif');
    }

    await this.assertUniqueIdentity(
      workspaceId,
      client.email_normalized,
      client.phone_normalized,
      id,
    );

    try {
      return await this.prisma.client.update({
        where: {
          id,
        },
        data: {
          deleted_at: null,
        },
      });
    } catch (error) {
      this.mapPrismaUniqueError(error);
    }
  }

  async hardDelete(_workspaceId: string, _id: string): Promise<Client> {
    throw new BadRequestException(
      'La suppression definitive des clients est desactivee afin de conserver l historique.',
    );
  }

  async createContact(
    workspaceId: string,
    clientId: string,
    dto: CreateClientContactDto,
  ) {
    await this.findClient(workspaceId, clientId, false);

    const firstName = dto.first_name.trim();
    const lastName = dto.last_name.trim();

    if (!firstName || !lastName) {
      throw new BadRequestException(
        'Le prenom et le nom du contact sont requis',
      );
    }

    const email = this.normalization.normalizeEmail(dto.email);
    const phone = this.normalization.normalizePhone(dto.phone);

    return this.prisma.$transaction(async (tx) => {
      if (dto.is_primary) {
        await tx.clientContact.updateMany({
          where: {
            client_id: clientId,
            workspace_id: workspaceId,
            deleted_at: null,
            is_primary: true,
          },
          data: {
            is_primary: false,
          },
        });
      }

      return tx.clientContact.create({
        data: {
          workspace_id: workspaceId,
          client_id: clientId,
          first_name: firstName,
          last_name: lastName,
          role: dto.role?.trim() || null,
          email,
          phone,
          is_primary: dto.is_primary ?? false,
          receives_proforma: dto.receives_proforma ?? false,
          receives_invoice: dto.receives_invoice ?? false,
        },
      });
    });
  }

  async updateContact(
    workspaceId: string,
    clientId: string,
    contactId: string,
    dto: UpdateClientContactDto,
  ) {
    await this.findClient(workspaceId, clientId, false);

    const contact = await this.prisma.clientContact.findFirst({
      where: {
        id: contactId,
        workspace_id: workspaceId,
        client_id: clientId,
        deleted_at: null,
      },
    });

    if (!contact) {
      throw new NotFoundException('Contact client introuvable');
    }

    if (
      dto.first_name !== undefined &&
      !dto.first_name.trim()
    ) {
      throw new BadRequestException('Le prenom du contact est requis');
    }

    if (
      dto.last_name !== undefined &&
      !dto.last_name.trim()
    ) {
      throw new BadRequestException('Le nom du contact est requis');
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.is_primary === true) {
        await tx.clientContact.updateMany({
          where: {
            client_id: clientId,
            workspace_id: workspaceId,
            deleted_at: null,
            is_primary: true,
            id: {
              not: contactId,
            },
          },
          data: {
            is_primary: false,
          },
        });
      }

      return tx.clientContact.update({
        where: {
          id: contactId,
        },
        data: {
          ...(dto.first_name !== undefined
            ? {
                first_name: dto.first_name.trim(),
              }
            : {}),
          ...(dto.last_name !== undefined
            ? {
                last_name: dto.last_name.trim(),
              }
            : {}),
          ...(dto.role !== undefined
            ? {
                role: dto.role.trim() || null,
              }
            : {}),
          ...(dto.email !== undefined
            ? {
                email: this.normalization.normalizeEmail(dto.email),
              }
            : {}),
          ...(dto.phone !== undefined
            ? {
                phone: this.normalization.normalizePhone(dto.phone),
              }
            : {}),
          ...(dto.is_primary !== undefined
            ? {
                is_primary: dto.is_primary,
              }
            : {}),
          ...(dto.receives_proforma !== undefined
            ? {
                receives_proforma: dto.receives_proforma,
              }
            : {}),
          ...(dto.receives_invoice !== undefined
            ? {
                receives_invoice: dto.receives_invoice,
              }
            : {}),
        },
      });
    });
  }

  async softDeleteContact(
    workspaceId: string,
    clientId: string,
    contactId: string,
  ) {
    await this.findClient(workspaceId, clientId, false);

    const contact = await this.prisma.clientContact.findFirst({
      where: {
        id: contactId,
        workspace_id: workspaceId,
        client_id: clientId,
        deleted_at: null,
      },
    });

    if (!contact) {
      throw new NotFoundException('Contact client introuvable');
    }

    return this.prisma.clientContact.update({
      where: {
        id: contactId,
      },
      data: {
        deleted_at: new Date(),
        is_primary: false,
      },
    });
  }
}
