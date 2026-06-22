import { Controller, Get, Query, Res, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { Response } from 'express';
import { AppointmentsService } from './appointments.service';

@Controller('public/appointments')
export class PublicValidationController {
  private readonly logger = new Logger(PublicValidationController.name);
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get('validate')
  async validate(@Query('token') token: string, @Res() res: Response) {
    if (!token) throw new BadRequestException('token is required');
    const appt = await this.appointmentsService.findByValidationToken(token);
    if (!appt) throw new NotFoundException('appointment not found or token invalid/expired');

    const updated = await this.appointmentsService.confirmPublicAppointment(appt.id);
    this.logger.debug(`Public appointment validated id=${updated.id}`);
    // redirect to a simple public confirmation page if PUBLIC_BASE_URL_FRONT set, else return JSON
    const front = process.env.PUBLIC_BASE_URL_FRONT;
    if (front) return res.redirect(`${front}/booking/confirmed?appointmentId=${updated.id}`);
    return res.json({ id: updated.id, status: updated.status });
  }
}
export default PublicValidationController;
