import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { CreateClientContactDto } from './dto/create-client-contact.dto';
import { UpdateClientContactDto } from './dto/update-client-contact.dto';
import { INVOICE_STATUS } from '../../../../../shared/constants/status.constants';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async findAll(workspaceId: string) {
    if (!workspaceId) {
      throw new NotFoundException('Workspace ID is required');
    }

    return this.prisma.client.findMany({
      where: { workspace_id: workspaceId },
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(workspaceId: string, id: string) {
    const client = await this.prisma.client.findFirst({
      where: {
        id,
        workspace_id: workspaceId,
      },
      include: {
        contacts: {
          where: { deleted_at: null },
          orderBy: [
            { is_primary: 'desc' },
            { created_at: 'asc' },
          ],
        },
        vehicles: {
          where: { deleted_at: null },
          orderBy: { created_at: 'desc' },
        },
        appointments: {
          where: { deleted_at: null },
          include: {
            vehicle: true,
          },
          orderBy: { date: 'desc' },
        },
        cases: {
          include: {
            vehicle: true,
            interventions: {
              where: { deleted_at: null },
            },
            proformas: {
              where: { deleted_at: null },
              orderBy: { created_at: 'desc' },
            },
          },
          orderBy: { created_at: 'desc' },
        },
        invoices: {
          where: { deleted_at: null },
          include: {
            payments: true,
            paymentSchedules: true,
          },
          orderBy: { created_at: 'desc' },
        },
        payments: {
          where: { deleted_at: null },
          orderBy: { created_at: 'desc' },
        },
      },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    return client;
  }

  async create(dto: CreateClientDto) {
    return this.prisma.client.create({
      data: {
        workspace_id: dto.workspaceId,
        name: dto.name.trim(),
        phone: dto.phone?.trim() ?? '',
        email: dto.email?.trim() ?? '',
        type: dto.type ?? 'INDIVIDUAL',
        company_name: dto.company_name?.trim() || null,
        trade_name: dto.trade_name?.trim() || null,
        registration_number: dto.registration_number?.trim() || null,
        vat_number: dto.vat_number?.trim() || null,
        address: dto.address?.trim() || null,
        billing_address: dto.billing_address?.trim() || null,
        payment_terms_days: dto.payment_terms_days ?? 0,
        credit_limit: dto.credit_limit ?? null,
      },
    });
  }

  async update(
    workspaceId: string,
    id: string,
    dto: UpdateClientDto,
  ) {
    await this.findOne(workspaceId, id);

    return this.prisma.client.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone.trim() } : {}),
        ...(dto.email !== undefined ? { email: dto.email.trim() } : {}),
        ...(dto.type !== undefined ? { type: dto.type } : {}),
        ...(dto.company_name !== undefined
          ? { company_name: dto.company_name.trim() || null }
          : {}),
        ...(dto.trade_name !== undefined
          ? { trade_name: dto.trade_name.trim() || null }
          : {}),
        ...(dto.registration_number !== undefined
          ? { registration_number: dto.registration_number.trim() || null }
          : {}),
        ...(dto.vat_number !== undefined
          ? { vat_number: dto.vat_number.trim() || null }
          : {}),
        ...(dto.address !== undefined
          ? { address: dto.address.trim() || null }
          : {}),
        ...(dto.billing_address !== undefined
          ? { billing_address: dto.billing_address.trim() || null }
          : {}),
        ...(dto.payment_terms_days !== undefined
          ? { payment_terms_days: dto.payment_terms_days }
          : {}),
        ...(dto.credit_limit !== undefined
          ? { credit_limit: dto.credit_limit }
          : {}),
      },
    });
  }

  // === SOFT DELETE avec protections ===
  async softDelete(workspaceId: string, id: string) {
    await this.findOne(workspaceId, id);

    // Vérifie les véhicules
    const vehicleCount = await this.prisma.vehicle.count({
      where: {
        workspace_id: workspaceId,
        client_id: id,
      },
    });

    if (vehicleCount > 0) {
      throw new BadRequestException(
        `Impossible de supprimer ce client : il possède encore ${vehicleCount} véhicule(s). Veuillez d'abord les supprimer ou les transférer.`
      );
    }

    // Vérifie les créances ouvertes
    const unpaidInvoicesCount = await this.prisma.invoice.count({
      where: {
        workspace_id: workspaceId,
        client_id: id,
        status: { not: INVOICE_STATUS.PAID },
      },
    });

    if (unpaidInvoicesCount > 0) {
      throw new BadRequestException(
        `Impossible de supprimer ce client : il a encore ${unpaidInvoicesCount} facture(s) non payée(s).`
      );
    }

    // Soft delete
    return this.prisma.client.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }

  async restore(workspaceId: string, id: string) {
    await this.findOne(workspaceId, id);

    return this.prisma.client.update({
      where: { id },
      data: { deleted_at: null },
    });
  }

  // === HARD DELETE (avec protections aussi) ===
  async hardDelete(workspaceId: string, id: string) {
    await this.findOne(workspaceId, id);

    const vehicleCount = await this.prisma.vehicle.count({
      where: {
        workspace_id: workspaceId,
        client_id: id,
      },
    });

    if (vehicleCount > 0) {
      throw new BadRequestException(
        `Impossible de supprimer définitivement ce client : il possède encore ${vehicleCount} véhicule(s).`
      );
    }

    const unpaidInvoicesCount = await this.prisma.invoice.count({
      where: {
        workspace_id: workspaceId,
        client_id: id,
        status: { not: INVOICE_STATUS.PAID },
      },
    });

    if (unpaidInvoicesCount > 0) {
      throw new BadRequestException(
        `Impossible de supprimer définitivement ce client : il a encore ${unpaidInvoicesCount} facture(s) non payée(s).`
      );
    }

    return this.prisma.client.delete({ where: { id } });
  }

  async createContact(
    workspaceId: string,
    clientId: string,
    dto: CreateClientContactDto,
  ) {
    const client = await this.prisma.client.findFirst({
      where: {
        id: clientId,
        workspace_id: workspaceId,
        deleted_at: null,
      },
    });

    if (!client) {
      throw new NotFoundException(
        'Client introuvable dans ce workspace.',
      );
    }

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
          first_name: dto.first_name.trim(),
          last_name: dto.last_name.trim(),
          role: dto.role?.trim() || null,
          email: dto.email?.trim() || null,
          phone: dto.phone?.trim() || null,
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
    const contact = await this.prisma.clientContact.findFirst({
      where: {
        id: contactId,
        workspace_id: workspaceId,
        client_id: clientId,
        deleted_at: null,
      },
    });

    if (!contact) {
      throw new NotFoundException(
        'Contact client introuvable.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.is_primary === true) {
        await tx.clientContact.updateMany({
          where: {
            client_id: clientId,
            workspace_id: contact.workspace_id,
            deleted_at: null,
            is_primary: true,
            id: { not: contactId },
          },
          data: {
            is_primary: false,
          },
        });
      }

      return tx.clientContact.update({
        where: { id: contactId },
        data: {
          ...(dto.first_name !== undefined
            ? { first_name: dto.first_name.trim() }
            : {}),
          ...(dto.last_name !== undefined
            ? { last_name: dto.last_name.trim() }
            : {}),
          ...(dto.role !== undefined
            ? { role: dto.role.trim() || null }
            : {}),
          ...(dto.email !== undefined
            ? { email: dto.email.trim() || null }
            : {}),
          ...(dto.phone !== undefined
            ? { phone: dto.phone.trim() || null }
            : {}),
          ...(dto.is_primary !== undefined
            ? { is_primary: dto.is_primary }
            : {}),
          ...(dto.receives_proforma !== undefined
            ? { receives_proforma: dto.receives_proforma }
            : {}),
          ...(dto.receives_invoice !== undefined
            ? { receives_invoice: dto.receives_invoice }
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
    const contact = await this.prisma.clientContact.findFirst({
      where: {
        id: contactId,
        workspace_id: workspaceId,
        client_id: clientId,
        deleted_at: null,
      },
    });

    if (!contact) {
      throw new NotFoundException(
        'Contact client introuvable.',
      );
    }

    return this.prisma.clientContact.update({
      where: { id: contactId },
      data: {
        deleted_at: new Date(),
        is_primary: false,
      },
    });
  }

}