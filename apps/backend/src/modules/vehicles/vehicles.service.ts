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

  async findOne(workspaceId: string, id: string) {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: {
        id,
        workspace_id: workspaceId,
        deleted_at: null,
      },
      include: {
        client: true,
        appointments: {
          where: {
            deleted_at: null,
          },
          include: {
            time_slot: true,
          },
          orderBy: {
            date: 'desc',
          },
        },
        cases: {
          include: {
            interventions: {
              where: {
                deleted_at: null,
              },
              orderBy: {
                created_at: 'desc',
              },
            },
            proformas: {
              orderBy: {
                created_at: 'desc',
              },
            },
          },
          orderBy: {
            created_at: 'desc',
          },
        },
      },
    });

    if (!vehicle) {
      throw new NotFoundException(
        'Véhicule introuvable',
      );
    }

    return vehicle;
  }

  // ==================== CREATE ====================

  async create(workspaceId: string, dto: CreateVehicleDto) {
    if (!workspaceId) {
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
    await this.validateClient(dto.clientId, workspaceId);
    await this.validateUniqueRegistration(dto.registration, workspaceId);

    return this.prisma.vehicle.create({
      data: {
        workspace_id: workspaceId,
        client_id: dto.clientId,
        registration: dto.registration.trim(),
        brand: dto.brand.trim(),
        model: dto.model.trim(),
        fleet_number: dto.fleet_number?.trim() || null,
        vin: dto.vin?.trim() || null,
        year: dto.year ?? null,
        mileage: dto.mileage ?? null,
        usual_driver: dto.usual_driver?.trim() || null,
        cost_center: dto.cost_center?.trim() || null,
        service_name: dto.service_name?.trim() || null,
        status: dto.status || VEHICLE_STATUS.DISPONIBLE,
      },
      include: { client: true },
    });
  }

  // ==================== UPDATE ====================

  async update(
    workspaceId: string,
    id: string,
    dto: UpdateVehicleDto,
  ) {
    const vehicle = await this.findOne(workspaceId, id);

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
        ...(dto.registration !== undefined
          ? { registration: dto.registration.trim() }
          : {}),
        ...(dto.brand !== undefined
          ? { brand: dto.brand.trim() }
          : {}),
        ...(dto.model !== undefined
          ? { model: dto.model.trim() }
          : {}),
        ...(dto.fleet_number !== undefined
          ? { fleet_number: dto.fleet_number.trim() || null }
          : {}),
        ...(dto.vin !== undefined
          ? { vin: dto.vin.trim() || null }
          : {}),
        ...(dto.year !== undefined
          ? { year: dto.year }
          : {}),
        ...(dto.mileage !== undefined
          ? { mileage: dto.mileage }
          : {}),
        ...(dto.usual_driver !== undefined
          ? { usual_driver: dto.usual_driver.trim() || null }
          : {}),
        ...(dto.cost_center !== undefined
          ? { cost_center: dto.cost_center.trim() || null }
          : {}),
        ...(dto.service_name !== undefined
          ? { service_name: dto.service_name.trim() || null }
          : {}),
        ...(dto.clientId && { client_id: dto.clientId }),
        ...(dto.status && { status: dto.status }),
      },
      include: { client: true },
    });
  }

  // ==================== SOFT DELETE ====================

  async softDelete(workspaceId: string, id: string) {
    await this.findOne(workspaceId, id);

    if (await this.hasActiveAppointments(workspaceId, id)) {
      throw new BadRequestException(
        'Impossible de supprimer ce véhicule : il a des rendez-vous actifs'
      );
    }

    return this.prisma.vehicle.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }

  async restore(workspaceId: string, id: string) {
    const vehicle = await this.findOne(workspaceId, id);

    return this.prisma.vehicle.update({
      where: { id },
      data: { deleted_at: null },
    });
  }

  async hardDelete(workspaceId: string, id: string) {
    await this.findOne(workspaceId, id);
    return this.prisma.vehicle.delete({ where: { id } });
  }

  // ==================== MÉTHODES UTILITAIRES ====================

  private async hasActiveAppointments(
    workspaceId: string,
    vehicleId: string,
  ): Promise<boolean> {
    const count = await this.prisma.appointment.count({
      where: {
        workspace_id: workspaceId,
        vehicle_id: vehicleId,
        deleted_at: null,
        status: {
          in: [
            APPOINTMENT_STATUS.PENDING,
            APPOINTMENT_STATUS.CONFIRMED,
            APPOINTMENT_STATUS.IN_PROGRESS,
          ],
        },
      },
    });
    return count > 0;
  }
}