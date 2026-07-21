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
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';

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
    @Headers('x-workspace-id') headerWorkspaceId: string,
    @Query('workspaceId') queryWorkspaceId: string,
    @Query('date') date: string,
  ) {
    const workspaceId = headerWorkspaceId || queryWorkspaceId;
    return this.appointmentsService.getAvailableSlots(workspaceId, date);
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
    @Headers('x-workspace-id') workspaceId: string,
    @Body() dto: any,
    @Req() req: any,
  ) {
    const userId = req.user?.id || req.user?.sub || dto.user_id || null;
    return this.appointmentsService.create(workspaceId, userId, dto);
  }

  @Patch(':id')
  update(
    @Headers('x-workspace-id') workspaceId: string,
    @Param('id') id: string,
    @Body() dto: any,
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