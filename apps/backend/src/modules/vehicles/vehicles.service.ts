import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { 
  VEHICLE_STATUS, 
  APPOINTMENT_STATUS 
}  from '../../../../../shared/constants/status.constants';

@Injectable()
export class VehiclesService {
  constructor(private prisma: PrismaService) {}

  // ==================== VALIDATIONS ====================

  private validateStatus(status?: string) {
    if (status && !Object.values(VEHICLE_STATUS).includes(status as any)) {
      throw new BadRequestException(
        `Statut invalide. Valeurs autorisées : ${Object.values(VEHICLE_STATUS).join(', ')}`
      );
    }
  }

  private async validateClient(clientId: string, workspaceId: string) {
    const client = await this.prisma.client.findFirst({
      where: {
        id: clientId,
        workspace_id: workspaceId,
        deleted_at: null,
      },
    });

    if (!client) {
      throw new BadRequestException(
        'Le client sélectionné est invalide ou n’existe pas dans ce workspace'
      );
    }
  }

  private async validateUniqueRegistration(
    registration: string,
    workspaceId: string,
    excludeId?: string
  ) {
    const existing = await this.prisma.vehicle.findFirst({
      where: {
        registration,
        workspace_id: workspaceId,
        deleted_at: null,
        ...(excludeId && { id: { not: excludeId } }),
      },
    });

    if (existing) {
      throw new BadRequestException(
        `Un véhicule avec l'immatriculation "${registration}" existe déjà dans ce workspace`
      );
    }
  }

  // ==================== READ ====================

  async findAll(workspaceId: string) {
    return this.prisma.vehicle.findMany({
      where: {
        workspace_id: workspaceId,
        deleted_at: null,
      },
      include: { client: true },
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
      include: { client: true },
    });

    if (!vehicle) throw new NotFoundException('Vehicle not found');
    return vehicle;
  }

  // ==================== CREATE ====================

  async create(dto: CreateVehicleDto) {
    if (!dto.workspaceId) {
      throw new BadRequestException('workspaceId est requis');
    }

    if (!dto.clientId) {
      throw new BadRequestException('clientId est requis');
    }

    if (!dto.registration) {
      throw new BadRequestException('registration est requis');
    }

    if (!dto.brand) {
      throw new BadRequestException('brand est requis');
    }

    if (!dto.model) {
      throw new BadRequestException('model est requis');
    }

    this.validateStatus(dto.status);
    await this.validateClient(dto.clientId, dto.workspaceId);
    await this.validateUniqueRegistration(dto.registration, dto.workspaceId);

    return this.prisma.vehicle.create({
      data: {
        workspace_id: dto.workspaceId,
        client_id: dto.clientId,
        registration: dto.registration,
        brand: dto.brand,
        model: dto.model,
        status: dto.status || VEHICLE_STATUS.DISPONIBLE,
      },
      include: { client: true },
    });
  }

  // ==================== UPDATE ====================

  async update(id: string, dto: UpdateVehicleDto) {
    const vehicle = await this.findOne(id);

    this.validateStatus(dto.status);

    if (dto.clientId && dto.clientId !== vehicle.client_id) {
      await this.validateClient(dto.clientId, vehicle.workspace_id);
    }

    if (dto.registration && dto.registration !== vehicle.registration) {
      await this.validateUniqueRegistration(dto.registration, vehicle.workspace_id, id);
    }

    return this.prisma.vehicle.update({
      where: { id },
      data: {
        registration: dto.registration,
        brand: dto.brand,
        model: dto.model,
        ...(dto.clientId && { client_id: dto.clientId }),
        ...(dto.status && { status: dto.status }),
      },
      include: { client: true },
    });
  }

  // ==================== SOFT DELETE ====================

  async softDelete(id: string) {
    await this.findOne(id);

    if (await this.hasActiveAppointments(id)) {
      throw new BadRequestException(
        'Impossible de supprimer ce véhicule : il a des rendez-vous actifs'
      );
    }

    return this.prisma.vehicle.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }

  async restore(id: string) {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id } });
    if (!vehicle) throw new NotFoundException('Vehicle not found');

    return this.prisma.vehicle.update({
      where: { id },
      data: { deleted_at: null },
    });
  }

  async hardDelete(id: string) {
    await this.findOne(id);
    return this.prisma.vehicle.delete({ where: { id } });
  }

  // ==================== MÉTHODES UTILITAIRES ====================

  private async hasActiveAppointments(vehicleId: string): Promise<boolean> {
    const count = await this.prisma.appointment.count({
      where: {
        vehicle_id: vehicleId,
        deleted_at: null,
        status: { in: Object.values(APPOINTMENT_STATUS) }, // ← Correction ici
      },
    });
    return count > 0;
  }
}