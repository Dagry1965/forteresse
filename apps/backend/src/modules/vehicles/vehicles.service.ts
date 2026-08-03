import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Vehicle } from '@prisma/client';
import { PrismaService } from '../../core/prisma/prisma.service';
import { NormalizationService } from '../shared/normalization.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import {
  APPOINTMENT_STATUS,
  VEHICLE_STATUS,
  VEHICLE_STATUS_TRANSITIONS,
} from '../../../../../shared/constants/status.constants';

const ALLOWED_VEHICLE_STATUSES: string[] =
  Object.values(VEHICLE_STATUS);

@Injectable()
export class VehiclesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly normalization: NormalizationService,
  ) {}

  private validateStatus(status?: string) {
    if (
      status &&
      !ALLOWED_VEHICLE_STATUSES.includes(status)
    ) {
      throw new BadRequestException(
        `Statut invalide. Valeurs autorisees : ${ALLOWED_VEHICLE_STATUSES.join(', ')}`,
      );
    }
  }

  private assertStatusTransition(
    currentStatus: string,
    nextStatus: string,
  ) {
    if (currentStatus === nextStatus) {
      return;
    }

    const allowedTransitions =
      VEHICLE_STATUS_TRANSITIONS[currentStatus] ?? [];

    if (!allowedTransitions.includes(nextStatus)) {
      throw new BadRequestException(
        `Transition de vehicule interdite : ${currentStatus} -> ${nextStatus}`,
      );
    }
  }

  private async findVehicle(
    workspaceId: string,
    id: string,
    includeArchived: boolean,
  ) {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: {
        id,
        workspace_id: workspaceId,
        ...(includeArchived ? {} : { deleted_at: null }),
      },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicule introuvable');
    }

    return vehicle;
  }

  private async validateClient(
    clientId: string,
    workspaceId: string,
  ) {
    const client = await this.prisma.client.findFirst({
      where: {
        id: clientId,
        workspace_id: workspaceId,
        deleted_at: null,
      },
    });

    if (!client) {
      throw new BadRequestException(
        'Le client selectionne est invalide ou archive dans ce workspace',
      );
    }
  }

  private async assertUniqueIdentity(
    workspaceId: string,
    registrationNormalized: string,
    vinNormalized: string | null,
    excludeId?: string,
  ) {
    const existingRegistration =
      await this.prisma.vehicle.findFirst({
        where: {
          workspace_id: workspaceId,
          registration_normalized: registrationNormalized,
          ...(excludeId ? { id: { not: excludeId } } : {}),
        },
        select: {
          id: true,
          deleted_at: true,
        },
      });

    if (existingRegistration) {
      const archiveMessage = existingRegistration.deleted_at
        ? ' Un vehicule archive utilise deja cette immatriculation.'
        : '';

      throw new BadRequestException(
        `Un vehicule avec l immatriculation "${registrationNormalized}" existe deja dans ce workspace.${archiveMessage}`,
      );
    }

    if (vinNormalized) {
      const existingVin = await this.prisma.vehicle.findFirst({
        where: {
          workspace_id: workspaceId,
          vin_normalized: vinNormalized,
          ...(excludeId ? { id: { not: excludeId } } : {}),
        },
        select: {
          id: true,
          deleted_at: true,
        },
      });

      if (existingVin) {
        const archiveMessage = existingVin.deleted_at
          ? ' Un vehicule archive utilise deja ce VIN.'
          : '';

        throw new BadRequestException(
          `Un vehicule avec le VIN "${vinNormalized}" existe deja dans ce workspace.${archiveMessage}`,
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
        'Un vehicule avec la meme immatriculation ou le meme VIN existe deja dans ce workspace.',
      );
    }

    throw error;
  }

  async findAll(workspaceId: string) {
    if (!workspaceId) {
      throw new BadRequestException('workspaceId est requis');
    }

    return this.prisma.vehicle.findMany({
      where: {
        workspace_id: workspaceId,
        deleted_at: null,
      },
      include: {
        client: true,
      },
      orderBy: {
        created_at: 'desc',
      },
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
      },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicule introuvable');
    }

    return vehicle;
  }

  async create(
    workspaceId: string,
    dto: CreateVehicleDto,
  ) {
    if (!workspaceId) {
      throw new BadRequestException('workspaceId est requis');
    }

    const registration = dto.registration.trim().toUpperCase();
    const registrationNormalized =
      this.normalization.normalizeRegistration(dto.registration);

    if (!registrationNormalized) {
      throw new BadRequestException(
        'L immatriculation du vehicule est invalide',
      );
    }

    const brand = dto.brand.trim();
    const model = dto.model.trim();

    if (!brand) {
      throw new BadRequestException('La marque est requise');
    }

    if (!model) {
      throw new BadRequestException('Le modele est requis');
    }

    const vinNormalized =
      this.normalization.normalizeVin(dto.vin);

    this.validateStatus(dto.status);
    await this.validateClient(dto.clientId, workspaceId);
    await this.assertUniqueIdentity(
      workspaceId,
      registrationNormalized,
      vinNormalized,
    );

    try {
      return await this.prisma.vehicle.create({
        data: {
          workspace_id: workspaceId,
          client_id: dto.clientId,
          registration,
          registration_normalized: registrationNormalized,
          brand,
          model,
          fleet_number: dto.fleet_number?.trim() || null,
          vin: vinNormalized,
          vin_normalized: vinNormalized,
          year: dto.year ?? null,
          mileage: dto.mileage ?? null,
          usual_driver: dto.usual_driver?.trim() || null,
          cost_center: dto.cost_center?.trim() || null,
          service_name: dto.service_name?.trim() || null,
          status: dto.status ?? VEHICLE_STATUS.DISPONIBLE,
        },
        include: {
          client: true,
        },
      });
    } catch (error) {
      this.mapPrismaUniqueError(error);
    }
  }

  async update(
    workspaceId: string,
    id: string,
    dto: UpdateVehicleDto,
  ) {
    const vehicle = await this.findVehicle(
      workspaceId,
      id,
      false,
    );

    this.validateStatus(dto.status);

    if (dto.status !== undefined) {
      this.assertStatusTransition(
        vehicle.status,
        dto.status,
      );
    }

    if (
      dto.clientId !== undefined &&
      dto.clientId !== vehicle.client_id
    ) {
      await this.validateClient(
        dto.clientId,
        workspaceId,
      );
    }

    const registration =
      dto.registration !== undefined
        ? dto.registration.trim().toUpperCase()
        : vehicle.registration;

    const registrationNormalized =
      dto.registration !== undefined
        ? this.normalization.normalizeRegistration(dto.registration)
        : vehicle.registration_normalized;

    if (!registrationNormalized) {
      throw new BadRequestException(
        'L immatriculation du vehicule est invalide',
      );
    }

    const vinNormalized =
      dto.vin !== undefined
        ? this.normalization.normalizeVin(dto.vin)
        : vehicle.vin_normalized;

    await this.assertUniqueIdentity(
      workspaceId,
      registrationNormalized,
      vinNormalized,
      id,
    );

    if (dto.brand !== undefined && !dto.brand.trim()) {
      throw new BadRequestException('La marque est requise');
    }

    if (dto.model !== undefined && !dto.model.trim()) {
      throw new BadRequestException('Le modele est requis');
    }

    try {
      return await this.prisma.vehicle.update({
        where: {
          id,
        },
        data: {
          ...(dto.registration !== undefined
            ? {
                registration,
                registration_normalized: registrationNormalized,
              }
            : {}),
          ...(dto.brand !== undefined
            ? {
                brand: dto.brand.trim(),
              }
            : {}),
          ...(dto.model !== undefined
            ? {
                model: dto.model.trim(),
              }
            : {}),
          ...(dto.fleet_number !== undefined
            ? {
                fleet_number: dto.fleet_number.trim() || null,
              }
            : {}),
          ...(dto.vin !== undefined
            ? {
                vin: vinNormalized,
                vin_normalized: vinNormalized,
              }
            : {}),
          ...(dto.year !== undefined
            ? {
                year: dto.year,
              }
            : {}),
          ...(dto.mileage !== undefined
            ? {
                mileage: dto.mileage,
              }
            : {}),
          ...(dto.usual_driver !== undefined
            ? {
                usual_driver:
                  dto.usual_driver.trim() || null,
              }
            : {}),
          ...(dto.cost_center !== undefined
            ? {
                cost_center:
                  dto.cost_center.trim() || null,
              }
            : {}),
          ...(dto.service_name !== undefined
            ? {
                service_name:
                  dto.service_name.trim() || null,
              }
            : {}),
          ...(dto.clientId !== undefined
            ? {
                client_id: dto.clientId,
              }
            : {}),
          ...(dto.status !== undefined
            ? {
                status: dto.status,
              }
            : {}),
        },
        include: {
          client: true,
        },
      });
    } catch (error) {
      this.mapPrismaUniqueError(error);
    }
  }

  async softDelete(
    workspaceId: string,
    id: string,
  ) {
    await this.findVehicle(workspaceId, id, false);

    if (await this.hasActiveAppointments(workspaceId, id)) {
      throw new BadRequestException(
        'Impossible d archiver ce vehicule : il a des rendez-vous actifs',
      );
    }

    return this.prisma.vehicle.update({
      where: {
        id,
      },
      data: {
        deleted_at: new Date(),
      },
    });
  }

  async restore(
    workspaceId: string,
    id: string,
  ) {
    const vehicle = await this.findVehicle(
      workspaceId,
      id,
      true,
    );

    if (!vehicle.deleted_at) {
      throw new BadRequestException(
        'Ce vehicule est deja actif',
      );
    }

    await this.validateClient(
      vehicle.client_id,
      workspaceId,
    );

    await this.assertUniqueIdentity(
      workspaceId,
      vehicle.registration_normalized,
      vehicle.vin_normalized,
      id,
    );

    try {
      return await this.prisma.vehicle.update({
        where: {
          id,
        },
        data: {
          deleted_at: null,
        },
        include: {
          client: true,
        },
      });
    } catch (error) {
      this.mapPrismaUniqueError(error);
    }
  }

  async hardDelete(
    _workspaceId: string,
    _id: string,
  ): Promise<Vehicle> {
    throw new BadRequestException(
      'La suppression definitive des vehicules est desactivee afin de conserver l historique.',
    );
  }

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
