import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';

@Controller('public/appointments')
export class PublicValidationController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get('validate')
  async validate(@Query('token') token: string) {
    // fonctionnalité désactivée
    throw new BadRequestException('Validation publique désactivée.');
  }
}
