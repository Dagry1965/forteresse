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
import type { Request } from 'express';
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard';
import { WorkspaceGuard } from '../../core/auth/workspace.guard';
import { RolesGuard } from '../../core/auth/roles.guard';
import { Roles } from '../../core/auth/roles.decorator';
import { USER_ROLE } from '../../../../../shared/constants/status.constants';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { ChangeTimeSlotDto } from './dto/change-time-slot.dto';

type AuthenticatedRequest = Request & {
  workspaceId?: string;
  user?: {
    id?: string;
    workspaceId?: string;
    workspace_id?: string;
  };
};

@UseGuards(JwtAuthGuard, WorkspaceGuard, RolesGuard)
@Roles(
  USER_ROLE.ADMIN,
  USER_ROLE.RECEPTION,
  USER_ROLE.WORKSHOP,
  USER_ROLE.MECHANIC,
  USER_ROLE.READ_ONLY,
)
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
  @Roles(
    USER_ROLE.ADMIN,
    USER_ROLE.RECEPTION,
    USER_ROLE.WORKSHOP,
  )
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
  @Roles(
    USER_ROLE.ADMIN,
    USER_ROLE.RECEPTION,
  )
  create(
    @Headers('x-workspace-id') headerWorkspaceId: string,
    @Body() dto: CreateAppointmentDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const workspaceId =
      req.workspaceId ||
      req.user?.workspaceId ||
      req.user?.workspace_id ||
      headerWorkspaceId;

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
  @Roles(
    USER_ROLE.ADMIN,
    USER_ROLE.RECEPTION,
  )
  cancel(
    @Headers('x-workspace-id') workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.appointmentsService.cancel(workspaceId, id);
  }

  @Patch(':id/change-time-slot')
  @Roles(
    USER_ROLE.ADMIN,
    USER_ROLE.RECEPTION,
  )
  changeTimeSlot(
    @Headers('x-workspace-id') workspaceId: string,
    @Param('id') id: string,
    @Body() dto: ChangeTimeSlotDto,
  ) {
    return this.appointmentsService.changeTimeSlot(
      workspaceId,
      id,
      dto,
    );
  }

  @Patch(':id/restore')
  @Roles(
    USER_ROLE.ADMIN,
    USER_ROLE.RECEPTION,
  )
  restore(
    @Headers('x-workspace-id') workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.appointmentsService.restore(workspaceId, id);
  }

  @Patch(':id')
  @Roles(
    USER_ROLE.ADMIN,
    USER_ROLE.RECEPTION,
  )
  update(
    @Headers('x-workspace-id') workspaceId: string,
    @Param('id') id: string,
    @Body() dto: UpdateAppointmentDto,
  ) {
    return this.appointmentsService.update(workspaceId, id, dto);
  }

  @Delete(':id')
  @Roles(
    USER_ROLE.ADMIN,
    USER_ROLE.RECEPTION,
  )
  remove(
    @Headers('x-workspace-id') workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.appointmentsService.remove(workspaceId, id);
  }
}
