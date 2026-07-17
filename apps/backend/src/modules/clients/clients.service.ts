import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

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

  async findOne(id: string) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: {
        vehicles: true,
        appointments: true,
        invoices: true,
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
        name: dto.name,
       phone: dto.phone ?? '',
       email: dto.email ?? '',
        type: dto.type ?? 'INDIVIDUAL',
      },
    });
  }

  async update(id: string, dto: UpdateClientDto) {
    await this.findOne(id);

    return this.prisma.client.update({
      where: { id },
      data: dto,
    });
  }

  // === SOFT DELETE avec protections ===
  async softDelete(id: string) {
    await this.findOne(id);

    // Vérifie les véhicules
    const vehicleCount = await this.prisma.vehicle.count({
      where: { client_id: id },
    });

    if (vehicleCount > 0) {
      throw new BadRequestException(
        `Impossible de supprimer ce client : il possède encore ${vehicleCount} véhicule(s). Veuillez d'abord les supprimer ou les transférer.`
      );
    }

    // Vérifie les créances ouvertes
    const unpaidInvoicesCount = await this.prisma.invoice.count({
      where: {
        client_id: id,
        status: { not: 'PAID' },
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

  async restore(id: string) {
    const client = await this.prisma.client.findUnique({ where: { id } });
    if (!client) throw new NotFoundException('Client not found');

    return this.prisma.client.update({
      where: { id },
      data: { deleted_at: null },
    });
  }

  // === HARD DELETE (avec protections aussi) ===
  async hardDelete(id: string) {
    await this.findOne(id);

    const vehicleCount = await this.prisma.vehicle.count({
      where: { client_id: id },
    });

    if (vehicleCount > 0) {
      throw new BadRequestException(
        `Impossible de supprimer définitivement ce client : il possède encore ${vehicleCount} véhicule(s).`
      );
    }

    const unpaidInvoicesCount = await this.prisma.invoice.count({
      where: {
        client_id: id,
        status: { not: 'PAID' },
      },
    });

    if (unpaidInvoicesCount > 0) {
      throw new BadRequestException(
        `Impossible de supprimer définitivement ce client : il a encore ${unpaidInvoicesCount} facture(s) non payée(s).`
      );
    }

    return this.prisma.client.delete({ where: { id } });
  }
}