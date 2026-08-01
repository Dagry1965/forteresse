import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard';
import { WorkspaceGuard } from '../../core/auth/workspace.guard';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

@UseGuards(JwtAuthGuard, WorkspaceGuard)
@Controller('appointments')
export class AppointmentController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get()
  findAll(@Headers('x-workspace-id') workspaceId: string) {
    return this.appointmentsService.findAll(workspaceId);
  }

  @Get('pending')
  getPending(@Headers('x-workspace-id') workspaceId: string) {
    return this.appointmentsService.getPending(workspaceId);
  }

  @Get('available-slots')
  getAvailableSlots(
    @Headers('x-workspace-id') workspaceId: string,
    @Query('date') date: string,
  ) {
    return this.appointmentsService.getAvailableSlots(workspaceId, date);
  }
  @Post(':id/start-workshop')
  startWorkshop(
    @Headers('x-workspace-id') workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.appointmentsService.convertToIntervention(workspaceId, id);
  }

  @Get(':id')
  findOne(
    @Headers('x-workspace-id') workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.appointmentsService.findOne(workspaceId, id);
  }

   @Post()
  create(
    @Headers('x-workspace-id') headerWorkspaceId: string,
    @Body() dto: CreateAppointmentDto,
    @Req() req: any,
  ) {
    const workspaceId =
      req.workspaceId ||
      req.user?.workspaceId ||
      req.user?.workspace_id ||
      headerWorkspaceId ||
      req.headers?.['x-workspace-id'];

    if (!workspaceId) {
      throw new BadRequestException('Workspace ID missing');
    }

    const userId = req.user?.id;

    if (!userId) {
      throw new UnauthorizedException(
        'Utilisateur authentifie introuvable.',
      );
    }

    return this.appointmentsService.create(workspaceId, userId, dto);
  }

  @Patch(':id/cancel')
  cancel(
    @Headers('x-workspace-id') workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.appointmentsService.cancel(workspaceId, id);
  }

  @Patch(':id')
  update(
    @Headers('x-workspace-id') workspaceId: string,
    @Param('id') id: string,
    @Body() dto: UpdateAppointmentDto,
  ) {
    return this.appointmentsService.update(workspaceId, id, dto);
  }

  @Delete(':id')
  remove(
    @Headers('x-workspace-id') workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.appointmentsService.remove(workspaceId, id);
  }
}