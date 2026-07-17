import { Controller, Get, UseGuards, Headers, Patch, Body, Param,} from '@nestjs/common';
import { WorkshopService } from './workshop.service';
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard';
import { WorkspaceGuard } from '../../core/auth/workspace.guard';

@Controller('workshop')
@UseGuards(JwtAuthGuard, WorkspaceGuard)
export class WorkshopController {
  constructor(private readonly workshopService: WorkshopService) {}

  @Get('metrics')
  getMetrics(@Headers('x-workspace-id') workspaceId: string) {
    return this.workshopService.getDashboardMetrics(workspaceId);
  }

@Patch('interventions/case/:caseId/status')
@UseGuards(WorkspaceGuard)
async updateStatus(
  @Headers('x-workspace-id') workspaceId: string,
  @Param('caseId') caseId: string,
  @Body('status') status: string
) {
  return this.workshopService.updateCaseStatus(workspaceId, caseId, status);
}

}
