import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../core/prisma/prisma.service';
import { SchedulingService } from '../shared/scheduling.service';
import {
  TIME_SLOT_STATUS,
  TIME_SLOT_STATUS_TRANSITIONS,
} from '../../../../../shared/constants/status.constants';
import { CreateTimeslotDto } from './dto/create-timeslot.dto';
import { UpdateTimeslotDto } from './dto/update-timeslot.dto';

@Injectable()
export class TimeSlotsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly schedulingService: SchedulingService,
  ) {}

  private assertStatusTransition(
    currentStatus: string,
    nextStatus: string,
  ): void {
    if (currentStatus === nextStatus) {
      return;
    }

    const allowedTransitions =
      TIME_SLOT_STATUS_TRANSITIONS[currentStatus] ?? [];

    if (!allowedTransitions.includes(nextStatus)) {
      throw new BadRequestException(
        'Transition de cr\u00e9neau interdite : '
          + currentStatus
          + ' -> '
          + nextStatus,
      );
    }
  }

  async create(workspaceId: string, dto: CreateTimeslotDto) {
    const start = new Date(dto.start);
    const end = new Date(dto.end);

    this.schedulingService.assertValidInterval(start, end);

    const existing = await this.prisma.timeSlot.findUnique({
      where: {
        workspace_id_start_end: {
          workspace_id: workspaceId,
          start,
          end,
        },
      },
    });

    if (existing) {
      if (existing.deleted_at) {
        throw new ConflictException(
          'Un cr\u00e9neau supprim\u00e9 existe d\u00e9j\u00e0 pour cet horaire',
        );
      }

      throw new ConflictException(
        'Ce cr\u00e9neau existe d\u00e9j\u00e0',
      );
    }

    return this.prisma.timeSlot.create({
      data: {
        workspace_id: workspaceId,
        start,
        end,
        status: dto.status ?? TIME_SLOT_STATUS.OPEN,
        occupancy: 0,
      },
    });
  }

  async findAll(workspaceId: string) {
    return this.prisma.timeSlot.findMany({
      where: {
        workspace_id: workspaceId,
        deleted_at: null,
      },
      orderBy: { start: 'asc' },
    });
  }

  async findOne(workspaceId: string, id: string) {
    return this.schedulingService.findActiveTimeSlot(
      this.prisma,
      workspaceId,
      id,
    );
  }

  async update(
    workspaceId: string,
    id: string,
    dto: UpdateTimeslotDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const existing =
        await this.schedulingService.findActiveTimeSlot(
          tx,
          workspaceId,
          id,
        );

      const newStart = dto.start
        ? new Date(dto.start)
        : existing.start;

      const newEnd = dto.end
        ? new Date(dto.end)
        : existing.end;

      this.schedulingService.assertValidInterval(newStart, newEnd);

      const datesChanged =
        newStart.getTime() !== existing.start.getTime()
        || newEnd.getTime() !== existing.end.getTime();

      if (datesChanged) {
        const appointmentCount = await tx.appointment.count({
          where: {
            time_slot_id: id,
            deleted_at: null,
          },
        });

        if (appointmentCount > 0) {
          throw new ConflictException(
            'Impossible de modifier les horaires d\u2019un cr\u00e9neau utilis\u00e9',
          );
        }

        const duplicate = await tx.timeSlot.findFirst({
          where: {
            workspace_id: workspaceId,
            start: newStart,
            end: newEnd,
            id: { not: id },
          },
        });

        if (duplicate) {
          throw new ConflictException(
            'Un cr\u00e9neau existe d\u00e9j\u00e0 pour cet horaire',
          );
        }
      }

      if (dto.status !== undefined) {
        this.assertStatusTransition(existing.status, dto.status);

        if (dto.status !== TIME_SLOT_STATUS.OPEN) {
          const activeAppointments =
            await this.schedulingService.countSlotOccupancy(tx, id);

          if (activeAppointments > 0) {
            throw new ConflictException(
              'Impossible de fermer ou d\u2019annuler un cr\u00e9neau occup\u00e9',
            );
          }
        }
      }

      const updated = await tx.timeSlot.update({
        where: { id },
        data: {
          start: datesChanged ? newStart : undefined,
          end: datesChanged ? newEnd : undefined,
          status: dto.status,
        },
      });

      await this.schedulingService.recalculateTimeSlotOccupancy(
        tx,
        id,
      );

      return updated;
    });
  }

  async cancel(workspaceId: string, id: string) {
    return this.prisma.$transaction(async (tx) => {
      const slot =
        await this.schedulingService.findActiveTimeSlot(
          tx,
          workspaceId,
          id,
        );

      this.assertStatusTransition(
        slot.status,
        TIME_SLOT_STATUS.CANCELLED,
      );

      const activeAppointments =
        await this.schedulingService.countSlotOccupancy(tx, id);

      if (activeAppointments > 0) {
        throw new ConflictException(
          'Impossible d\u2019annuler un cr\u00e9neau occup\u00e9',
        );
      }

      return tx.timeSlot.update({
        where: { id },
        data: {
          status: TIME_SLOT_STATUS.CANCELLED,
        },
      });
    });
  }

  async remove(workspaceId: string, id: string) {
    return this.prisma.$transaction(async (tx) => {
      await this.schedulingService.findActiveTimeSlot(
        tx,
        workspaceId,
        id,
      );

      const appointmentCount = await tx.appointment.count({
        where: {
          time_slot_id: id,
        },
      });

      if (appointmentCount > 0) {
        throw new ConflictException(
          'Impossible de supprimer un cr\u00e9neau li\u00e9 \u00e0 des rendez-vous',
        );
      }

      return tx.timeSlot.update({
        where: { id },
        data: {
          deleted_at: new Date(),
        },
      });
    });
  }

  async restore(workspaceId: string, id: string) {
    return this.prisma.$transaction(async (tx) => {
      const slot = await tx.timeSlot.findFirst({
        where: {
          id,
          workspace_id: workspaceId,
          deleted_at: { not: null },
        },
      });

      if (!slot) {
        throw new NotFoundException(
          'Cr\u00e9neau introuvable ou non supprim\u00e9',
        );
      }

      const duplicate = await tx.timeSlot.findFirst({
        where: {
          workspace_id: workspaceId,
          start: slot.start,
          end: slot.end,
          deleted_at: null,
          id: { not: id },
        },
      });

      if (duplicate) {
        throw new ConflictException(
          'Un cr\u00e9neau actif existe d\u00e9j\u00e0 pour cet horaire',
        );
      }

      const restored = await tx.timeSlot.update({
        where: { id },
        data: {
          deleted_at: null,
          status: TIME_SLOT_STATUS.OPEN,
        },
      });

      await this.schedulingService.recalculateTimeSlotOccupancy(
        tx,
        id,
      );

      return restored;
    });
  }

  async findAvailable(workspaceId: string, date: string) {
    const settings =
      await this.schedulingService.getBusinessSettings(workspaceId);

    const bounds = this.schedulingService.getZonedDayBounds(
      date,
      settings.timezone,
    );

    const slots = await this.prisma.timeSlot.findMany({
      where: {
        workspace_id: workspaceId,
        deleted_at: null,
        status: TIME_SLOT_STATUS.OPEN,
        start: {
          gte: bounds.start,
          lt: bounds.end,
        },
      },
      orderBy: { start: 'asc' },
    });

    const result = [];

    for (const slot of slots) {
      const occupancy =
        await this.schedulingService.countSlotOccupancy(
          this.prisma,
          slot.id,
        );

      const available = Math.max(
        0,
        settings.maxConcurrent - occupancy,
      );

      result.push({
        ...slot,
        occupancy,
        capacity: settings.maxConcurrent,
        available,
        isAvailable: available > 0,
        label: this.schedulingService.formatSlotLabel(
          slot.start,
          slot.end,
          settings.timezone,
        ),
      });
    }

    return result;
  }
}
