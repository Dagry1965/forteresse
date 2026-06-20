import { Controller, Get, Post, Body, Req, Param, Patch, UseGuards } from '@nestjs/common';
import { WorkshopService } from './workshop.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { WorkspaceGuard } from './auth/workspace.guard';

@Controller('workshop')
@UseGuards(JwtAuthGuard, WorkspaceGuard)
export class WorkshopController {
  constructor(private readonly workshopService: WorkshopService) {}

  @Post('appointment')
  createAppointment(@Body() data: any) {
    return this.workshopService.createAppointment(data);
  }

  @Get('appointments')
  findAll(@Req() req: any) {
    const workspaceId = req.headers['x-workspace-id'];
    return this.workshopService.findAllAppointments(workspaceId);
  }

  @Post('intervention/:appointmentId')
  start(@Param('appointmentId') appId: string) {
    return this.workshopService.startIntervention(appId);
  }

  @Patch('intervention/:id/diagnosis')
  updateDiag(@Param('id') id: string, @Body() body: { diagnosis: string }) {
    return this.workshopService.updateDiagnosis(id, body.diagnosis);
  }
}
