import { Controller, Post, Body, HttpCode, HttpStatus, Logger, Inject } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { addMinutes } from 'date-fns';
import type { Queue } from 'bullmq';

import { AppointmentsService } from './appointments.service';
import { CreatePublicAppointmentDto } from './dto/create-public-appointment.dto';
import { Appointment } from '@prisma/client';

/*
  Controller responsable des rendez-vous venant du public (/booking endpoint).
  - force publicOrigin = true
  - status = PENDING
  - génère validationToken + expiration
  - enregistre via service métier
  - émet job BullMQ public-appointment.created
*/

@Controller('public/appointments')
export class PublicAppointmentController {
  private readonly logger = new Logger(PublicAppointmentController.name);

  constructor(
    private readonly appointmentsService: AppointmentsService,
    @Inject('BULLMQ_MAIN_QUEUE') private readonly queue: Queue, // token défini dans votre module BullMQ
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreatePublicAppointmentDto): Promise<{ id: string; validationUrl?: string }> {
    // génère token court
    const validationToken = uuidv4();
    // TTL token : 24h (configurable)
    const validationTokenExpires = addMinutes(new Date(), 60 * 24);

    // Construire payload d'enregistrement (respecter le schéma métier)
    const payload = {
      ...dto,
      publicOrigin: true,
      status: 'PENDING',
      validationToken,
      validationTokenExpires,
    } as Partial<Appointment & { validationToken?: string; validationTokenExpires?: Date }>;

    // Délégué au service métier (vérifications, conflits, persistance)
    const appointment = await this.appointmentsService.createPublicAppointment(payload);

    this.logger.debug(`Public appointment created id=${appointment.id} token=${validationToken}`);

    // Émettre un job pour notifier admin / workflow (BullMQ)
    try {
      await this.queue.add('public-appointment.created', {
        appointmentId: appointment.id,
        validationToken,
        customer: {
          name: (dto as any).customerName ?? null,
          email: (dto as any).customerEmail ?? null,
          phone: (dto as any).customerPhone ?? null,
        },
      });
    } catch (e) {
      this.logger.error('Failed to enqueue public-appointment.created', e as any);
      // Ne pas échouer la création client pour un échec de queue ; se logue pour réconciliation
    }

    // Construire url de validation publique (back-end doit exposer endpoint GET /public/appointments/validate?token=...)
    const validationUrl = `${process.env.PUBLIC_BASE_URL ?? ''}/public/appointments/validate?token=${validationToken}`;

    return { id: appointment.id, validationUrl };
  }
}

export default PublicAppointmentController;
