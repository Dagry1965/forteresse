import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import {
  TIME_SLOT_STATUS,
  TIME_SLOT_STATUS_TRANSITIONS,
} from '../../../../../shared/constants/status.constants';
import { CreateTimeslotDto } from './dto/create-timeslot.dto';
import { UpdateTimeslotDto } from './dto/update-timeslot.dto';

@Injectable()
export class TimeSlotsService {
  constructor(private readonly prisma: PrismaService) {}

  private assertStatusTransition(currentStatus: string, nextStatus: string) {
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

  // ==================== CREATE ====================
  async create(workspaceId: string, dto: CreateTimeslotDto) {
    const start = new Date(dto.start);
    const end = new Date(dto.end);

    if (end <= start) {
      throw new BadRequestException('La fin doit être après le début');
    }

    await this.checkOverlap(workspaceId, start, end);

    return this.prisma.timeSlot.create({
      data: {
        workspace_id: workspaceId,
        start,
        end,
        status: dto.status || TIME_SLOT_STATUS.OPEN,
      },
    });
  }

  // ==================== READ ====================
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
    const slot = await this.prisma.timeSlot.findFirst({
      where: { 
        id, 
        workspace_id: workspaceId,
        deleted_at: null 
      },
    });
    if (!slot) throw new NotFoundException('Créneau non trouvé');
    return slot;
  }

  // ==================== UPDATE ====================
  async update(workspaceId: string, id: string, dto: UpdateTimeslotDto) {
    const existing = await this.findOne(workspaceId, id);

    const newStart = dto.start ? new Date(dto.start) : existing.start;
    const newEnd = dto.end ? new Date(dto.end) : existing.end;

    if (newEnd <= newStart) {
      throw new BadRequestException('La fin doit être après le début');
    }

    await this.checkOverlap(workspaceId, newStart, newEnd, id);

    if (dto.status !== undefined) {
      this.assertStatusTransition(existing.status, dto.status);
    }

    return this.prisma.timeSlot.update({
      where: { id },
      data: {
        start: dto.start ? newStart : undefined,
        end: dto.end ? newEnd : undefined,
        status: dto.status,
      },
    });
  }

  // ==================== CANCEL (Soft Delete style) ====================
  async cancel(workspaceId: string, id: string) {
    const slot = await this.findOne(workspaceId, id);
    this.assertStatusTransition(slot.status, TIME_SLOT_STATUS.CANCELLED);

    return this.prisma.timeSlot.update({
      where: { id },
      data: { 
        status: TIME_SLOT_STATUS.CANCELLED,
        deleted_at: new Date() 
      },
    });
  }

  // ==================== DELETE (Soft Delete) ====================
  async remove(workspaceId: string, id: string) {
    await this.findOne(workspaceId, id);

    return this.prisma.timeSlot.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }

  // ==================== RESTORE ====================
  async restore(workspaceId: string, id: string) {
    const slot = await this.prisma.timeSlot.findFirst({
      where: { id, workspace_id: workspaceId, deleted_at: { not: null } },
    });

    if (!slot) throw new NotFoundException('Créneau non trouvé ou non supprimé');

    return this.prisma.timeSlot.update({
      where: { id },
      data: { deleted_at: null, status: TIME_SLOT_STATUS.OPEN },
    });
  }

  // ==================== AVAILABLE ====================
  async findAvailable(workspaceId: string, date: string) {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    return this.prisma.timeSlot.findMany({
      where: {
        workspace_id: workspaceId,
        deleted_at: null,
        status: TIME_SLOT_STATUS.OPEN,
        start: { gte: dayStart, lte: dayEnd },
      },
      orderBy: { start: 'asc' },
    });
  }

  // ==================== PRIVATE ====================
  private async checkOverlap(workspaceId: string, start: Date, end: Date, excludeId?: string) {
    const overlapping = await this.prisma.timeSlot.findFirst({
      where: {
        workspace_id: workspaceId,
        deleted_at: null,
        status: { not: TIME_SLOT_STATUS.CANCELLED },
        AND: [
          { start: { lt: end } },
          { end: { gt: start } },
        ],
        ...(excludeId && { id: { not: excludeId } }),
      },
    });

    if (overlapping) {
      throw new ConflictException('Ce créneau chevauche un autre créneau existant');
    }
  }
}
