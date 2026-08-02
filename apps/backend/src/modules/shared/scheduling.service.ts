import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  formatInTimeZone,
  fromZonedTime,
} from 'date-fns-tz';

import { PrismaService } from '../../core/prisma/prisma.service';
import {
  APPOINTMENT_STATUS,
  TIME_SLOT_STATUS,
} from '../../../../../shared/constants/status.constants';

type PrismaClientLike = PrismaService | Prisma.TransactionClient;

type SlotInterval = {
  start: Date;
  end: Date;
};

const COUNTABLE_APPOINTMENT_STATUSES = [
  APPOINTMENT_STATUS.PENDING,
  APPOINTMENT_STATUS.CONFIRMED,
  APPOINTMENT_STATUS.IN_PROGRESS,
];

@Injectable()
export class SchedulingService {
  constructor(private readonly prisma: PrismaService) {}

  isCountableAppointmentStatus(status: string): boolean {
    return COUNTABLE_APPOINTMENT_STATUSES.includes(status as any);
  }

  async getBusinessSettings(
    workspaceId: string,
    prisma: PrismaClientLike = this.prisma,
  ) {
    if (!workspaceId) {
      throw new BadRequestException('Workspace ID missing');
    }

    const existing = await prisma.businessSettings.findUnique({
      where: { workspace_id: workspaceId },
    });

    if (existing) {
      return existing;
    }

    return prisma.businessSettings.create({
      data: {
        workspace_id: workspaceId,
        openingTime: '08:00',
        closingTime: '18:00',
        slotDuration: 30,
        maxConcurrent: 2,
        timezone: 'UTC',
        workingDays: '1,2,3,4,5,6',
      },
    });
  }

  parseWorkingDays(value: string): number[] {
    return value
      .split(',')
      .map((item) => Number(item.trim()))
      .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6);
  }

  formatWorkingDays(days: number[]): string {
    return [...new Set(days)]
      .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6)
      .sort((left, right) => left - right)
      .join(',');
  }

  assertValidInterval(start: Date, end: Date): void {
    if (
      Number.isNaN(start.getTime())
      || Number.isNaN(end.getTime())
    ) {
      throw new BadRequestException(
        'La date et l\u2019heure du cr\u00e9neau sont invalides',
      );
    }

    if (end <= start) {
      throw new BadRequestException(
        'La fin du cr\u00e9neau doit \u00eatre apr\u00e8s le d\u00e9but',
      );
    }
  }

  async getOrCreateTimeSlot(
    prisma: PrismaClientLike,
    workspaceId: string,
    start: Date,
    end: Date,
  ) {
    this.assertValidInterval(start, end);

    const existing = await prisma.timeSlot.findUnique({
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
          'Ce cr\u00e9neau existe mais il est supprim\u00e9',
        );
      }

      if (existing.status !== TIME_SLOT_STATUS.OPEN) {
        throw new ConflictException(
          'Ce cr\u00e9neau n\u2019est pas ouvert \u00e0 la r\u00e9servation',
        );
      }

      return existing;
    }

    return prisma.timeSlot.create({
      data: {
        workspace_id: workspaceId,
        start,
        end,
        status: TIME_SLOT_STATUS.OPEN,
        occupancy: 0,
      },
    });
  }

  async findActiveTimeSlot(
    prisma: PrismaClientLike,
    workspaceId: string,
    timeSlotId: string,
  ) {
    const slot = await prisma.timeSlot.findFirst({
      where: {
        id: timeSlotId,
        workspace_id: workspaceId,
        deleted_at: null,
      },
    });

    if (!slot) {
      throw new NotFoundException('Cr\u00e9neau introuvable');
    }

    return slot;
  }

  async countSlotOccupancy(
    prisma: PrismaClientLike,
    timeSlotId: string,
    excludeAppointmentId?: string,
  ): Promise<number> {
    return prisma.appointment.count({
      where: {
        time_slot_id: timeSlotId,
        deleted_at: null,
        status: {
          in: COUNTABLE_APPOINTMENT_STATUSES,
        },
        ...(excludeAppointmentId
          ? { id: { not: excludeAppointmentId } }
          : {}),
      },
    });
  }

  async assertTimeSlotAvailable(
    prisma: PrismaClientLike,
    workspaceId: string,
    timeSlotId: string,
    excludeAppointmentId?: string,
  ) {
    const slot = await this.findActiveTimeSlot(
      prisma,
      workspaceId,
      timeSlotId,
    );

    if (slot.status !== TIME_SLOT_STATUS.OPEN) {
      throw new ConflictException(
        'Ce cr\u00e9neau n\u2019est pas disponible',
      );
    }

    const settings = await this.getBusinessSettings(workspaceId, prisma);
    const occupancy = await this.countSlotOccupancy(
      prisma,
      slot.id,
      excludeAppointmentId,
    );

    if (occupancy >= settings.maxConcurrent) {
      throw new ConflictException(
        'La capacit\u00e9 de ce cr\u00e9neau est atteinte',
      );
    }

    return {
      slot,
      occupancy,
      capacity: settings.maxConcurrent,
    };
  }

  async recalculateTimeSlotOccupancy(
    prisma: PrismaClientLike,
    timeSlotId: string,
  ) {
    const occupancy = await this.countSlotOccupancy(prisma, timeSlotId);

    return prisma.timeSlot.update({
      where: { id: timeSlotId },
      data: { occupancy },
    });
  }

  async recalculateTimeSlotsOccupancy(
    prisma: PrismaClientLike,
    timeSlotIds: Array<string | null | undefined>,
  ): Promise<void> {
    const uniqueIds = [...new Set(timeSlotIds.filter(Boolean) as string[])];

    for (const timeSlotId of uniqueIds) {
      await this.recalculateTimeSlotOccupancy(prisma, timeSlotId);
    }
  }

  getZonedDayBounds(date: string, timezone: string): SlotInterval {
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new BadRequestException(
        'La date doit respecter le format AAAA-MM-JJ',
      );
    }

    const start = fromZonedTime(`${date}T00:00:00.000`, timezone);
    const nextDay = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    const nextDate = formatInTimeZone(nextDay, timezone, 'yyyy-MM-dd');
    const endExclusive = fromZonedTime(
      `${nextDate}T00:00:00.000`,
      timezone,
    );

    return {
      start,
      end: endExclusive,
    };
  }

  getZonedDateKey(date: Date, timezone: string): string {
    return formatInTimeZone(date, timezone, 'yyyy-MM-dd');
  }

  getZonedDayOfWeek(date: Date, timezone: string): number {
    return Number(formatInTimeZone(date, timezone, 'i')) % 7;
  }

  generateSlotsForDate(
    date: string,
    openingTime: string,
    closingTime: string,
    slotDuration: number,
    timezone: string,
  ): SlotInterval[] {
    if (slotDuration <= 0 || !Number.isInteger(slotDuration)) {
      throw new BadRequestException(
        'La dur\u00e9e des cr\u00e9neaux doit \u00eatre un entier positif',
      );
    }

    const timePattern = /^\d{2}:\d{2}$/;

    if (
      !timePattern.test(openingTime)
      || !timePattern.test(closingTime)
    ) {
      throw new BadRequestException(
        'Les horaires doivent respecter le format HH:mm',
      );
    }

    const opening = fromZonedTime(
      `${date}T${openingTime}:00.000`,
      timezone,
    );
    const closing = fromZonedTime(
      `${date}T${closingTime}:00.000`,
      timezone,
    );

    this.assertValidInterval(opening, closing);

    const slots: SlotInterval[] = [];
    let current = opening;

    while (current < closing) {
      const end = new Date(
        current.getTime() + slotDuration * 60 * 1000,
      );

      if (end > closing) {
        break;
      }

      slots.push({
        start: new Date(current),
        end,
      });

      current = end;
    }

    return slots;
  }

  formatSlotLabel(
    start: Date,
    end: Date,
    timezone: string,
  ): string {
    const startLabel = formatInTimeZone(start, timezone, 'HH:mm');
    const endLabel = formatInTimeZone(end, timezone, 'HH:mm');

    return `${startLabel} \u2013 ${endLabel}`;
  }
}
