import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import {
  APPOINTMENT_STATUS,
  CASE_STATUS,
  INTERVENTION_STATUS,
  TIME_SLOT_STATUS,
} from '../../../../../shared/constants/status.constants';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { ChangeTimeSlotDto } from './dto/change-time-slot.dto';

const COUNTABLE_APPOINTMENT_STATUSES = [
  APPOINTMENT_STATUS.PENDING,
  APPOINTMENT_STATUS.CONFIRMED,
  APPOINTMENT_STATUS.IN_PROGRESS,
];

@Injectable()
export class AppointmentsService {
  constructor(private readonly prisma: PrismaService) {}

  // ==================== MÉTHODES PUBLIQUES ====================

  async create(workspaceId: string, userId: string, dto: CreateAppointmentDto) {
    if (!workspaceId) {
      throw new BadRequestException('Workspace ID missing');
    }

    if (!userId) {
      const fallbackUser = await this.prisma.user.findFirst({
        where: {
          workspace_id: workspaceId,
          deleted_at: null,
        },
        orderBy: {
          created_at: 'asc',
        },
      });

      if (!fallbackUser) {
        throw new BadRequestException(
          'Aucun utilisateur actif trouvé dans ce workspace',
        );
      }

      userId = fallbackUser.id;
    }

    return this.prisma.$transaction(async (tx) => {
      await this.validateAppointmentRelations(tx, workspaceId, dto, userId);

      let timeSlotId: string;
      let finalDate: Date;

      // === Cas 1 : Créneau dynamique (startTime + endTime) ===
      const isDynamicSlot =
        (!dto.timeSlotId || dto.timeSlotId.trim() === '') &&
        dto.startTime?.trim() &&
        dto.endTime?.trim();

      if (isDynamicSlot) {
        const start = new Date(dto.startTime!);
        const end = new Date(dto.endTime!);

        // Création d'un nouveau TimeSlot avec occupancy = 1 (ce RDV)
        const newTimeSlot = await tx.timeSlot.create({
          data: {
            workspace_id: workspaceId,
            start,
            end,
            status: TIME_SLOT_STATUS.OPEN,
            occupancy: 1,
          },
        });

        timeSlotId = newTimeSlot.id;
        finalDate = start;
      }
      // === Cas 2 : TimeSlot existant ===
      else if (dto.timeSlotId && dto.timeSlotId.trim() !== '') {
        // Vérifie que la capacité n'est pas dépassée (via occupancy)
        await this.validateTimeSlotAvailability(
          tx,
          workspaceId,
          dto.timeSlotId,
        );

        const timeSlot = await tx.timeSlot.findFirst({
          where: {
            id: dto.timeSlotId,
            workspace_id: workspaceId,
          },
        });
        if (!timeSlot) {
          throw new NotFoundException('TimeSlot not found');
        }

        const settings = await this.getBusinessSettings(workspaceId);
        const capacity = settings.maxConcurrent ?? 1;

        if (timeSlot.occupancy >= capacity) {
          throw new ConflictException(
            'This time slot capacity is already reached',
          );
        }

        // Incrémenter l'occupancy du TimeSlot existant
        await tx.timeSlot.update({
          where: { id: dto.timeSlotId },
          data: { occupancy: { increment: 1 } },
        });

        finalDate = dto.date ? new Date(dto.date) : timeSlot.start;
        timeSlotId = dto.timeSlotId;
      } else {
        throw new BadRequestException(
          'Vous devez fournir soit timeSlotId, soit startTime + endTime',
        );
      }

      await this.validateNoSameDayAppointment(
        tx,
        workspaceId,
        dto.vehicleId,
        finalDate,
      );

      return tx.appointment.create({
        data: {
          workspace_id: workspaceId,
          client_id: dto.clientId,
          vehicle_id: dto.vehicleId,
          time_slot_id: timeSlotId,
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
    });
  }

  async findAll(workspaceId: string) {
    return this.prisma.appointment.findMany({
      where: { workspace_id: workspaceId, deleted_at: null },
      include: { client: true, vehicle: true, time_slot: true },
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
      include: { client: true, vehicle: true, time_slot: true },
      orderBy: { date: 'asc' },
    });
  }

  async findOne(workspaceId: string, id: string) {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id, workspace_id: workspaceId, deleted_at: null },
      include: { client: true, vehicle: true, time_slot: true },
    });
    if (!appointment) throw new NotFoundException('Appointment not found');
    return appointment;
  }

  async update(workspaceId: string, id: string, dto: UpdateAppointmentDto) {
    const appointment = await this.findOne(workspaceId, id);

    if (dto.date) {
      await this.validateNoSameDayAppointment(
        this.prisma,
        workspaceId,
        appointment.vehicle_id,
        new Date(dto.date),
        id,
      );
    }

    return this.prisma.appointment.update({
      where: { id },
      data: {
        status: dto.status,
        date: dto.date ? new Date(dto.date) : undefined,
      },
      include: { client: true, vehicle: true, time_slot: true },
    });
  }

  async cancel(workspaceId: string, id: string) {
    // On gère l'occupancy dans une transaction
    return this.prisma.$transaction(async (tx) => {
      const appointment = await tx.appointment.findFirst({
        where: { id, workspace_id: workspaceId, deleted_at: null },
        include: { time_slot: true },
      });

      if (!appointment) {
        throw new NotFoundException('Appointment not found');
      }

      if (appointment.status === APPOINTMENT_STATUS.CANCELLED) {
        throw new BadRequestException('Appointment is already cancelled');
      }

      // Si ce RDV était compté dans la capacité, décrémenter occupancy
      if (
        COUNTABLE_APPOINTMENT_STATUSES.includes(
          appointment.status as any,
        ) &&
        appointment.time_slot
      ) {
        await tx.timeSlot.update({
          where: { id: appointment.time_slot_id },
          data: { occupancy: { decrement: 1 } },
        });
      }

      return tx.appointment.update({
        where: { id },
        data: { status: APPOINTMENT_STATUS.CANCELLED },
        include: { client: true, vehicle: true, time_slot: true },
      });
    });
  }

  async changeTimeSlot(workspaceId: string, id: string, dto: ChangeTimeSlotDto) {
    return this.prisma.$transaction(async (tx) => {
      const appointment = await tx.appointment.findFirst({
        where: { id, workspace_id: workspaceId, deleted_at: null },
        include: { time_slot: true },
      });
      if (!appointment) throw new NotFoundException('Appointment not found');

      const oldTimeSlotId = appointment.time_slot_id;

      // Vérifie que le nouveau créneau est disponible (via occupancy + capacité)
      await this.validateTimeSlotAvailability(
        tx,
        workspaceId,
        dto.timeSlotId,
        id,
      );

      const newTimeSlot = await tx.timeSlot.findFirst({
        where: { id: dto.timeSlotId, workspace_id: workspaceId },
      });
      if (!newTimeSlot) throw new NotFoundException('TimeSlot not found');

      const settings = await this.getBusinessSettings(workspaceId);
      const capacity = settings.maxConcurrent ?? 1;

      if (newTimeSlot.occupancy >= capacity) {
        throw new ConflictException(
          'This time slot capacity is already reached',
        );
      }

      // 1) Décrémenter l'ancien timeSlot si le RDV était compté
      if (
        oldTimeSlotId &&
        COUNTABLE_APPOINTMENT_STATUSES.includes(
          appointment.status as any,
        )
      ) {
        await tx.timeSlot.update({
          where: { id: oldTimeSlotId },
          data: { occupancy: { decrement: 1 } },
        });
      }

      // 2) Incrémenter le nouveau timeSlot
      await tx.timeSlot.update({
        where: { id: dto.timeSlotId },
        data: { occupancy: { increment: 1 } },
      });

      // 3) Mettre à jour le RDV
      return tx.appointment.update({
        where: { id },
        data: {
          time_slot_id: dto.timeSlotId,
          date: newTimeSlot.start,
          status: APPOINTMENT_STATUS.PENDING,
        },
        include: { client: true, vehicle: true, time_slot: true },
      });
    });
  }

  async remove(workspaceId: string, id: string) {
    await this.findOne(workspaceId, id);
    return this.prisma.appointment.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }

  async restore(workspaceId: string, id: string) {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id, workspace_id: workspaceId, deleted_at: { not: null } },
    });
    if (!appointment)
      throw new NotFoundException('Appointment not found or not deleted');

    return this.prisma.appointment.update({
      where: { id },
      data: { deleted_at: null },
      include: { client: true, vehicle: true, time_slot: true },
    });
  }

  // ==================== BUSINESS SETTINGS ====================

  async getBusinessSettings(workspaceId: string) {
    let settings = await this.prisma.businessSettings.findUnique({
      where: { workspace_id: workspaceId },
    });

    if (!settings) {
      settings = await this.prisma.businessSettings.create({
        data: {
          workspace_id: workspaceId,
          openingTime: '08:00',
          closingTime: '18:00',
          slotDuration: 30,
          maxConcurrent: 2,
          workingDays: '1,2,3,4,5,6',
        },
      });
    }

    return settings;
  }

  parseWorkingDays(workingDays: string): number[] {
    return workingDays
      .split(',')
      .map(Number)
      .filter(Boolean);
  }

  formatWorkingDays(days: number[]): string {
    return days.join(',');
  }

  // ==================== PHASE 2 : CRÉNEAUX DISPONIBLES ====================

  async getAvailableSlots(workspaceId: string, date: string) {
    const settings = await this.getBusinessSettings(workspaceId);
    const workingDays = this.parseWorkingDays(settings.workingDays);

    const targetDate = new Date(date);
    const dayOfWeek = targetDate.getDay();

    // Jour non travaillé → aucun créneau
    if (!workingDays.includes(dayOfWeek)) {
      return [];
    }

    const now = new Date();

    const allSlots = this.generateSlotsForDay(targetDate, settings).filter(
      (slot) => slot.start.getTime() > now.getTime(),
    );

    const dayStart = new Date(targetDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(targetDate);
    dayEnd.setHours(23, 59, 59, 999);

    // On charge les RDV existants de la journée avec leurs time_slots
    const existingAppointments = await this.prisma.appointment.findMany({
      where: {
        workspace_id: workspaceId,
        deleted_at: null,
        date: { gte: dayStart, lte: dayEnd },
        status: {
          in: [
            APPOINTMENT_STATUS.PENDING,
            APPOINTMENT_STATUS.CONFIRMED,
            APPOINTMENT_STATUS.IN_PROGRESS,
          ],
        },
      },
      include: { time_slot: true },
    });

    const capacity = settings.maxConcurrent; // ex: 2

    const result = allSlots.map((slot) => {
      // Combien de RDV se chevauchent avec ce créneau
      const overlappingCount = existingAppointments.filter((appt) => {
        if (!appt.time_slot) return false;

        const apptStart = new Date(appt.time_slot.start);
        const apptEnd = new Date(appt.time_slot.end);

        return apptStart < slot.end && apptEnd > slot.start;
      }).length;

      const booked = overlappingCount;
      const available = Math.max(0, capacity - booked);
      const isAvailable = available > 0;

      return {
        start: slot.start.toISOString(),
        end: slot.end.toISOString(),
        label: `${slot.start.toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
        })} – ${slot.end.toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
        })}`,
      booked,
      available,
      isAvailable,
      };
    });

    return result;
  }

  private generateSlotsForDay(date: Date, settings: any) {
    const slots: { start: Date; end: Date }[] = [];

    const [openHour, openMinute] = settings.openingTime.split(':').map(Number);
    const [closeHour, closeMinute] =
      settings.closingTime.split(':').map(Number);

    if (isNaN(openHour) || isNaN(closeHour)) {
      throw new Error(
        'Invalid opening or closing time format in BusinessSettings',
      );
    }

    const startTime = new Date(date);
    startTime.setHours(openHour, openMinute, 0, 0);

    const endTime = new Date(date);
    endTime.setHours(closeHour, closeMinute, 0, 0);

    let current = new Date(startTime);

    while (current < endTime) {
      const slotEnd = new Date(
        current.getTime() + settings.slotDuration * 60000,
      );
      if (slotEnd > endTime) break;

      slots.push({ start: new Date(current), end: slotEnd });
      current = slotEnd;
    }

    return slots;
  }

  // ==================== MÉTHODES PRIVÉES DE VALIDATION ====================

  private async validateAppointmentRelations(
    tx: any,
    workspaceId: string,
    dto: CreateAppointmentDto,
    userId: string,
  ) {
    const [workspace, user, client, vehicle, timeSlot] = await Promise.all([
      tx.workspace.findFirst({ where: { id: workspaceId } }),
      tx.user.findFirst({ where: { id: userId, workspace_id: workspaceId } }),
      tx.client.findFirst({
        where: { id: dto.clientId, workspace_id: workspaceId },
      }),
      tx.vehicle.findFirst({
        where: {
          id: dto.vehicleId,
          workspace_id: workspaceId,
          client_id: dto.clientId,
        },
      }),
      dto.timeSlotId
        ? tx.timeSlot.findFirst({
            where: { id: dto.timeSlotId, workspace_id: workspaceId },
          })
        : Promise.resolve(null),
    ]);

    if (!workspace) throw new NotFoundException('Workspace not found');
    if (!user)
      throw new BadRequestException(
        'User not found or does not belong to this workspace',
      );
    if (!client) throw new NotFoundException('Client not found in this workspace');
    if (!vehicle)
      throw new NotFoundException(
        'Vehicle not found or not linked to this client',
      );
    if (dto.timeSlotId && !timeSlot)
      throw new NotFoundException('TimeSlot not found in this workspace');

    const appointmentStart = dto.startTime
      ? new Date(dto.startTime)
      : timeSlot
        ? new Date(timeSlot.start)
        : null;

    if (!appointmentStart || Number.isNaN(appointmentStart.getTime())) {
      throw new BadRequestException(
        'La date et l’heure du rendez-vous sont invalides',
      );
    }

    if (appointmentStart.getTime() <= Date.now()) {
      throw new BadRequestException(
        'Impossible d’enregistrer un rendez-vous dans le passé',
      );
    }
  }

  private async validateTimeSlotAvailability(
    prisma: any,
    workspaceId: string,
    timeSlotId: string,
    excludeAppointmentId?: string,
  ) {
    const timeSlot = await prisma.timeSlot.findFirst({
      where: { id: timeSlotId, workspace_id: workspaceId },
    });
    if (!timeSlot) throw new NotFoundException('TimeSlot not found');
    if (timeSlot.status !== TIME_SLOT_STATUS.OPEN) {
      throw new ConflictException('This time slot is not available');
    }

    // Capacité via BusinessSettings
    const settings = await this.getBusinessSettings(workspaceId);
    const capacity = settings.maxConcurrent ?? 1;

    // Optionnel : pour vérifier aussi avec le nombre réel de RDV,
    // un contrôle supplémentaire peut être ajouté ici. Pour l'instant,
    // on s'appuie sur occupancy, géré dans create/cancel/changeTimeSlot.

    if (timeSlot.occupancy >= capacity) {
      throw new ConflictException('This time slot capacity is already reached');
    }
  }

  private async validateNoSameDayAppointment(
    prisma: any,
    workspaceId: string,
    vehicleId: string,
    date: Date,
    excludeAppointmentId?: string,
  ) {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const existing = await prisma.appointment.findFirst({
      where: {
        vehicle_id: vehicleId,
        workspace_id: workspaceId,
        deleted_at: null,
        date: { gte: dayStart, lte: dayEnd },
        status: {
          in: [
            APPOINTMENT_STATUS.PENDING,
            APPOINTMENT_STATUS.CONFIRMED,
            APPOINTMENT_STATUS.IN_PROGRESS,
          ],
        },
        ...(excludeAppointmentId && { id: { not: excludeAppointmentId } }),
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

      if (appointment.status === APPOINTMENT_STATUS.CANCELLED) {
        throw new BadRequestException(
          'Un rendez-vous annulé ne peut pas être envoyé à l’atelier.',
        );
      }

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

      const repairCase = await tx.case.create({
        data: {
          workspace_id: workspaceId,
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
          status: APPOINTMENT_STATUS.COMPLETED,
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
