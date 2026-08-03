import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../core/prisma/prisma.service';
import { SchedulingService } from '../shared/scheduling.service';
import { SequencingService } from '../shared/sequencing.service';
import {
  APPOINTMENT_STATUS,
  CASE_STATUS,
  INTERVENTION_STATUS,
  APPOINTMENT_STATUS_TRANSITIONS,
} from '../../../../../shared/constants/status.constants';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { ChangeTimeSlotDto } from './dto/change-time-slot.dto';

type PrismaClientLike = PrismaService | Prisma.TransactionClient;

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly schedulingService: SchedulingService,
    private readonly sequencingService: SequencingService,
  ) {}

  private assertAppointmentStatusTransition(
    currentStatus: string,
    nextStatus: string,
  ): void {
    if (currentStatus === nextStatus) {
      return;
    }

    const allowedTransitions =
      APPOINTMENT_STATUS_TRANSITIONS[currentStatus] ?? [];

    if (!allowedTransitions.includes(nextStatus)) {
      throw new BadRequestException(
        'Transition de rendez-vous interdite : '
          + currentStatus
          + ' -> '
          + nextStatus,
      );
    }
  }

  async create(
    workspaceId: string,
    userId: string,
    dto: CreateAppointmentDto,
  ) {
    if (!workspaceId) {
      throw new BadRequestException('Workspace ID missing');
    }

    return this.prisma.$transaction(async (tx) => {
      await this.validateAppointmentRelations(
        tx,
        workspaceId,
        dto,
        userId,
      );

      let timeSlot;

      if (
        (!dto.timeSlotId || dto.timeSlotId.trim() === '')
        && dto.startTime?.trim()
        && dto.endTime?.trim()
      ) {
        const start = new Date(dto.startTime);
        const end = new Date(dto.endTime);

        timeSlot = await this.schedulingService.getOrCreateTimeSlot(
          tx,
          workspaceId,
          start,
          end,
        );
      } else if (dto.timeSlotId?.trim()) {
        const availability =
          await this.schedulingService.assertTimeSlotAvailable(
            tx,
            workspaceId,
            dto.timeSlotId,
          );

        timeSlot = availability.slot;
      } else {
        throw new BadRequestException(
          'Vous devez fournir soit timeSlotId, soit startTime + endTime',
        );
      }

      await this.schedulingService.assertTimeSlotAvailable(
        tx,
        workspaceId,
        timeSlot.id,
      );

      const finalDate = timeSlot.start;

      await this.validateNoSameDayAppointment(
        tx,
        workspaceId,
        dto.vehicleId,
        finalDate,
      );

      const appointment = await tx.appointment.create({
        data: {
          workspace_id: workspaceId,
          client_id: dto.clientId,
          vehicle_id: dto.vehicleId,
          time_slot_id: timeSlot.id,
          user_id: userId,
          status: APPOINTMENT_STATUS.PENDING,
          date: finalDate,
        },
        include: {
          client: true,
          vehicle: { include: { client: true } },
          time_slot: true,
        },
      });

      await this.schedulingService.recalculateTimeSlotOccupancy(
        tx,
        timeSlot.id,
      );

      return appointment;
    });
  }

  async findAll(workspaceId: string) {
    return this.prisma.appointment.findMany({
      where: {
        workspace_id: workspaceId,
        deleted_at: null,
      },
      include: {
        client: true,
        vehicle: true,
        time_slot: true,
      },
      orderBy: { date: 'desc' },
    });
  }

  async getPending(workspaceId: string) {
    return this.prisma.appointment.findMany({
      where: {
        workspace_id: workspaceId,
        status: APPOINTMENT_STATUS.PENDING,
        deleted_at: null,
      },
      include: {
        client: true,
        vehicle: true,
        time_slot: true,
      },
      orderBy: { date: 'asc' },
    });
  }

  async findOne(workspaceId: string, id: string) {
    const appointment = await this.prisma.appointment.findFirst({
      where: {
        id,
        workspace_id: workspaceId,
        deleted_at: null,
      },
      include: {
        client: true,
        vehicle: true,
        time_slot: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    return appointment;
  }

  async update(
    workspaceId: string,
    id: string,
    dto: UpdateAppointmentDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const appointment = await tx.appointment.findFirst({
        where: {
          id,
          workspace_id: workspaceId,
          deleted_at: null,
        },
        include: {
          time_slot: true,
        },
      });

      if (!appointment) {
        throw new NotFoundException('Appointment not found');
      }

      if (
        dto.timeSlotId !== undefined
        || dto.startTime !== undefined
        || dto.endTime !== undefined
      ) {
        throw new BadRequestException(
          'Utilisez la route de changement de cr\u00e9neau',
        );
      }

      if (dto.clientId !== undefined || dto.vehicleId !== undefined) {
        throw new BadRequestException(
          'Le client et le v\u00e9hicule ne peuvent pas \u00eatre modifi\u00e9s ici',
        );
      }

      if (dto.date !== undefined) {
        throw new BadRequestException(
          'La date est pilot\u00e9e par le cr\u00e9neau',
        );
      }

      if (dto.status) {
        this.assertAppointmentStatusTransition(
          appointment.status,
          dto.status,
        );

        const becomesCountable =
          !this.schedulingService.isCountableAppointmentStatus(
            appointment.status,
          )
          && this.schedulingService.isCountableAppointmentStatus(
            dto.status,
          );

        if (becomesCountable) {
          await this.schedulingService.assertTimeSlotAvailable(
            tx,
            workspaceId,
            appointment.time_slot_id,
            appointment.id,
          );
        }
      }

      const updated = await tx.appointment.update({
        where: { id },
        data: {
          status: dto.status,
        },
        include: {
          client: true,
          vehicle: true,
          time_slot: true,
        },
      });

      await this.schedulingService.recalculateTimeSlotOccupancy(
        tx,
        appointment.time_slot_id,
      );

      return updated;
    });
  }

  async cancel(workspaceId: string, id: string) {
    return this.update(workspaceId, id, {
      status: APPOINTMENT_STATUS.CANCELLED,
    });
  }

  async changeTimeSlot(
    workspaceId: string,
    id: string,
    dto: ChangeTimeSlotDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const appointment = await tx.appointment.findFirst({
        where: {
          id,
          workspace_id: workspaceId,
          deleted_at: null,
        },
      });

      if (!appointment) {
        throw new NotFoundException('Appointment not found');
      }

      if (appointment.time_slot_id === dto.timeSlotId) {
        return tx.appointment.findUnique({
          where: { id },
          include: {
            client: true,
            vehicle: true,
            time_slot: true,
          },
        });
      }

      const availability =
        await this.schedulingService.assertTimeSlotAvailable(
          tx,
          workspaceId,
          dto.timeSlotId,
          appointment.id,
        );

      await this.validateNoSameDayAppointment(
        tx,
        workspaceId,
        appointment.vehicle_id,
        availability.slot.start,
        appointment.id,
      );

      const oldTimeSlotId = appointment.time_slot_id;

      const updated = await tx.appointment.update({
        where: { id },
        data: {
          time_slot_id: availability.slot.id,
          date: availability.slot.start,
        },
        include: {
          client: true,
          vehicle: true,
          time_slot: true,
        },
      });

      await this.schedulingService.recalculateTimeSlotsOccupancy(
        tx,
        [oldTimeSlotId, availability.slot.id],
      );

      return updated;
    });
  }

  async remove(workspaceId: string, id: string) {
    return this.prisma.$transaction(async (tx) => {
      const appointment = await tx.appointment.findFirst({
        where: {
          id,
          workspace_id: workspaceId,
          deleted_at: null,
        },
      });

      if (!appointment) {
        throw new NotFoundException('Appointment not found');
      }

      const removed = await tx.appointment.update({
        where: { id },
        data: {
          deleted_at: new Date(),
        },
      });

      await this.schedulingService.recalculateTimeSlotOccupancy(
        tx,
        appointment.time_slot_id,
      );

      return removed;
    });
  }

  async restore(workspaceId: string, id: string) {
    return this.prisma.$transaction(async (tx) => {
      const appointment = await tx.appointment.findFirst({
        where: {
          id,
          workspace_id: workspaceId,
          deleted_at: { not: null },
        },
      });

      if (!appointment) {
        throw new NotFoundException(
          'Appointment not found or not deleted',
        );
      }

      if (
        this.schedulingService.isCountableAppointmentStatus(
          appointment.status,
        )
      ) {
        await this.schedulingService.assertTimeSlotAvailable(
          tx,
          workspaceId,
          appointment.time_slot_id,
          appointment.id,
        );

        await this.validateNoSameDayAppointment(
          tx,
          workspaceId,
          appointment.vehicle_id,
          appointment.date,
          appointment.id,
        );
      }

      const restored = await tx.appointment.update({
        where: { id },
        data: {
          deleted_at: null,
        },
        include: {
          client: true,
          vehicle: true,
          time_slot: true,
        },
      });

      await this.schedulingService.recalculateTimeSlotOccupancy(
        tx,
        appointment.time_slot_id,
      );

      return restored;
    });
  }

  async getBusinessSettings(workspaceId: string) {
    return this.schedulingService.getBusinessSettings(workspaceId);
  }

  parseWorkingDays(workingDays: string): number[] {
    return this.schedulingService.parseWorkingDays(workingDays);
  }

  formatWorkingDays(days: number[]): string {
    return this.schedulingService.formatWorkingDays(days);
  }

  async getAvailableSlots(workspaceId: string, date: string) {
    const settings =
      await this.schedulingService.getBusinessSettings(workspaceId);

    const targetBounds =
      this.schedulingService.getZonedDayBounds(
        date,
        settings.timezone,
      );

    const dayOfWeek =
      this.schedulingService.getZonedDayOfWeek(
        targetBounds.start,
        settings.timezone,
      );

    const workingDays =
      this.schedulingService.parseWorkingDays(
        settings.workingDays,
      );

    if (!workingDays.includes(dayOfWeek)) {
      return [];
    }

    const generatedSlots =
      this.schedulingService.generateSlotsForDate(
        date,
        settings.openingTime,
        settings.closingTime,
        settings.slotDuration,
        settings.timezone,
      );

    const now = new Date();
    const result = [];

    for (const generated of generatedSlots) {
      if (generated.start <= now) {
        continue;
      }

      const existing = await this.prisma.timeSlot.findUnique({
        where: {
          workspace_id_start_end: {
            workspace_id: workspaceId,
            start: generated.start,
            end: generated.end,
          },
        },
      });

      let booked = 0;
      let slotId: string | null = null;
      let status = 'OPEN';

      if (existing && !existing.deleted_at) {
        slotId = existing.id;
        status = existing.status;
        booked =
          await this.schedulingService.countSlotOccupancy(
            this.prisma,
            existing.id,
          );
      }

      const available =
        status === 'OPEN'
          ? Math.max(0, settings.maxConcurrent - booked)
          : 0;

      result.push({
        id: slotId,
        start: generated.start.toISOString(),
        end: generated.end.toISOString(),
        label: this.schedulingService.formatSlotLabel(
          generated.start,
          generated.end,
          settings.timezone,
        ),
        booked,
        capacity: settings.maxConcurrent,
        available,
        isAvailable: available > 0,
        timezone: settings.timezone,
      });
    }

    return result;
  }

  private async validateAppointmentRelations(
    tx: PrismaClientLike,
    workspaceId: string,
    dto: CreateAppointmentDto,
    userId: string,
  ) {
    const [workspace, user, client, vehicle, timeSlot] =
      await Promise.all([
        tx.workspace.findFirst({
          where: { id: workspaceId },
        }),
        tx.user.findFirst({
          where: {
            id: userId,
            workspace_id: workspaceId,
          },
        }),
        tx.client.findFirst({
          where: {
            id: dto.clientId,
            workspace_id: workspaceId,
            deleted_at: null,
          },
        }),
        tx.vehicle.findFirst({
          where: {
            id: dto.vehicleId,
            workspace_id: workspaceId,
            client_id: dto.clientId,
            deleted_at: null,
          },
        }),
        dto.timeSlotId
          ? tx.timeSlot.findFirst({
              where: {
                id: dto.timeSlotId,
                workspace_id: workspaceId,
                deleted_at: null,
              },
            })
          : Promise.resolve(null),
      ]);

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    if (!user) {
      throw new BadRequestException(
        'User not found or does not belong to this workspace',
      );
    }

    if (!client) {
      throw new NotFoundException(
        'Client not found in this workspace',
      );
    }

    if (!vehicle) {
      throw new NotFoundException(
        'Vehicle not found or not linked to this client',
      );
    }

    if (dto.timeSlotId && !timeSlot) {
      throw new NotFoundException(
        'TimeSlot not found in this workspace',
      );
    }

    const appointmentStart = dto.startTime
      ? new Date(dto.startTime)
      : timeSlot
        ? new Date(timeSlot.start)
        : null;

    if (
      !appointmentStart
      || Number.isNaN(appointmentStart.getTime())
    ) {
      throw new BadRequestException(
        'La date et l\u2019heure du rendez-vous sont invalides',
      );
    }

    if (appointmentStart.getTime() <= Date.now()) {
      throw new BadRequestException(
        'Impossible d\u2019enregistrer un rendez-vous dans le pass\u00e9',
      );
    }
  }

  private async validateNoSameDayAppointment(
    prisma: PrismaClientLike,
    workspaceId: string,
    vehicleId: string,
    date: Date,
    excludeAppointmentId?: string,
  ) {
    const settings =
      await this.schedulingService.getBusinessSettings(
        workspaceId,
        prisma,
      );

    const dateKey =
      this.schedulingService.getZonedDateKey(
        date,
        settings.timezone,
      );

    const bounds =
      this.schedulingService.getZonedDayBounds(
        dateKey,
        settings.timezone,
      );

    const existing = await prisma.appointment.findFirst({
      where: {
        vehicle_id: vehicleId,
        workspace_id: workspaceId,
        deleted_at: null,
        date: {
          gte: bounds.start,
          lt: bounds.end,
        },
        status: {
          in: [
            APPOINTMENT_STATUS.PENDING,
            APPOINTMENT_STATUS.CONFIRMED,
            APPOINTMENT_STATUS.IN_PROGRESS,
          ],
        },
        ...(excludeAppointmentId
          ? { id: { not: excludeAppointmentId } }
          : {}),
      },
    });

    if (existing) {
      throw new ConflictException(
        'This vehicle already has an appointment on this day',
      );
    }
  }

  /**
 * Bascule un Rendez-vous en Dossier (Case) + Intervention
 */
async convertToIntervention(
    workspaceId: string,
    appointmentId: string,
  ) {
    if (!workspaceId) {
      throw new BadRequestException('workspaceId est requis.');
    }

    if (!appointmentId) {
      throw new BadRequestException('appointmentId est requis.');
    }

    return this.prisma.$transaction(async (tx) => {
      const appointment = await tx.appointment.findFirst({
        where: {
          id: appointmentId,
          workspace_id: workspaceId,
          deleted_at: null,
        },
        include: {
          client: true,
          vehicle: true,
        },
      });

      if (!appointment) {
        throw new NotFoundException(
          'Rendez-vous introuvable dans ce workspace.',
        );
      }

      this.assertAppointmentStatusTransition(
        appointment.status,
        APPOINTMENT_STATUS.IN_PROGRESS,
      );

      const existingCase = await tx.case.findFirst({
        where: {
          workspace_id: workspaceId,
          appointment_id: appointment.id,
        },
        include: {
          interventions: {
            where: {
              deleted_at: null,
            },
            orderBy: {
              created_at: 'asc',
            },
          },
        },
      });

      if (existingCase) {
        const existingIntervention =
          existingCase.interventions[0];

        if (!existingIntervention) {
          throw new ConflictException(
            'Le dossier lié au rendez-vous existe sans intervention active.',
          );
        }

        return {
          appointment,
          case: existingCase,
          intervention: existingIntervention,
          alreadyStarted: true,
        };
      }

      const caseReference = await this.sequencingService.generateReference(
        workspaceId,
        'CASE',
        tx,
      );

      const repairCase = await tx.case.create({
        data: {
          workspace_id: workspaceId,
          reference: caseReference,
          appointment_id: appointment.id,
          status: CASE_STATUS.RECEIVED,
          customer_id: appointment.client_id,
          vehicle_id: appointment.vehicle_id,
          title: `Atelier - ${appointment.vehicle.registration} (${appointment.date.toLocaleDateString('fr-FR')})`,
          description: `Dossier créé automatiquement depuis le rendez-vous #${appointment.id}`,
        },
      });

      await tx.appointment.update({
        where: {
          id: appointment.id,
        },
        data: {
          status: APPOINTMENT_STATUS.IN_PROGRESS,
        },
      });

      const intervention = await tx.intervention.create({
        data: {
          workspace_id: workspaceId,
          case_id: repairCase.id,
          description: `Diagnostic généré depuis le rendez-vous du ${appointment.date.toLocaleDateString('fr-FR')}`,
          status: INTERVENTION_STATUS.DIAGNOSIS,
        },
        include: {
          case: true,
        },
      });

      return {
        appointment,
        case: repairCase,
        intervention,
        alreadyStarted: false,
      };
    });
  }






}
