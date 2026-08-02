import { Controller, Get, UseGuards, Headers, Patch, Body, Param,} from '@nestjs/common';
import { WorkshopService } from './workshop.service';
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard';
import { WorkspaceGuard } from '../../core/auth/workspace.guard';
import { RolesGuard } from '../../core/auth/roles.guard';
import { Roles } from '../../core/auth/roles.decorator';
import { USER_ROLE } from '../../../../../shared/constants/status.constants';

@Controller('workshop')
@UseGuards(JwtAuthGuard, WorkspaceGuard, RolesGuard)
@Roles(
  USER_ROLE.ADMIN,
  USER_ROLE.RECEPTION,
  USER_ROLE.WORKSHOP,
  USER_ROLE.MECHANIC,
  USER_ROLE.READ_ONLY,
)
export class WorkshopController {
  constructor(private readonly workshopService: WorkshopService) {}

  @Get('metrics')
  getMetrics(@Headers('x-workspace-id') workspaceId: string) {
    return this.workshopService.getDashboardMetrics(workspaceId);
  }

@Patch('interventions/case/:caseId/status')
@Roles(
  USER_ROLE.ADMIN,
  USER_ROLE.WORKSHOP,
  USER_ROLE.MECHANIC,
)
async updateStatus(
  @Headers('x-workspace-id') workspaceId: string,
  @Param('caseId') caseId: string,
  @Body('status') status: string
) {
  return this.workshopService.updateCaseStatus(workspaceId, caseId, status);
}

}
