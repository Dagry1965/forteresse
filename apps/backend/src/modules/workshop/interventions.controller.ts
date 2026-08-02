import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Headers } from '@nestjs/common';
import { InterventionsService } from './interventions.service';
import { CreateInterventionDto } from './dto/create-intervention.dto';
import { UpdateInterventionDto } from './dto/update-intervention.dto';
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard';
import { WorkspaceGuard } from '../../core/auth/workspace.guard';
import { RolesGuard } from '../../core/auth/roles.guard';
import { Roles } from '../../core/auth/roles.decorator';
import { USER_ROLE } from '../../../../../shared/constants/status.constants';
import { CurrentUser } from '../../core/auth/current-user.decorator';

@Controller('workshop/interventions')
@UseGuards(JwtAuthGuard, WorkspaceGuard, RolesGuard)
@Roles(
  USER_ROLE.ADMIN,
  USER_ROLE.RECEPTION,
  USER_ROLE.WORKSHOP,
  USER_ROLE.MECHANIC,
  USER_ROLE.READ_ONLY,
)
export class InterventionsController {
  constructor(private readonly interventionsService: InterventionsService) {}

  @Post()
@Roles(
  USER_ROLE.ADMIN,
  USER_ROLE.WORKSHOP,
  USER_ROLE.MECHANIC,
)
  create(
    @Headers('x-workspace-id') workspaceId: string,
    @Body() dto: CreateInterventionDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.interventionsService.create(
      workspaceId,
      user?.id,
      dto,
    );
  }

  @Get()
  findAll(@Headers('x-workspace-id') workspaceId: string) {
    return this.interventionsService.findAll(workspaceId);
  }

  @Get(':id')
  findOne(
    @Headers('x-workspace-id') workspaceId: string,
    @Param('id') id: string
  ) {
    return this.interventionsService.findOne(workspaceId, id);
  }

  @Patch(':id')
@Roles(
  USER_ROLE.ADMIN,
  USER_ROLE.WORKSHOP,
  USER_ROLE.MECHANIC,
)
  update(
    @Headers('x-workspace-id') workspaceId: string,
    @Param('id') id: string,
    @Body() dto: UpdateInterventionDto
  ) {
    return this.interventionsService.update(workspaceId, id, dto);
  }

  @Delete(':id')
@Roles(
  USER_ROLE.ADMIN,
  USER_ROLE.WORKSHOP,
)
  remove(
    @Headers('x-workspace-id') workspaceId: string,
    @Param('id') id: string
  ) {
    return this.interventionsService.remove(workspaceId, id);
  }

  @Post(':id/parts')
@Roles(
  USER_ROLE.ADMIN,
  USER_ROLE.WORKSHOP,
  USER_ROLE.MECHANIC,
  USER_ROLE.STOCK,
)
addPart(
  @Headers('x-workspace-id') workspaceId: string,
  @Param('id') interventionId: string,
  @Body() dto: { item_id: string; quantity: number },
  @CurrentUser() user: { id: string },
) {
  return this.interventionsService.addPart(
    workspaceId,
    interventionId,
    user?.id,
    dto,
  );
}

@Delete('parts/:partId')
@Roles(
  USER_ROLE.ADMIN,
  USER_ROLE.WORKSHOP,
  USER_ROLE.MECHANIC,
  USER_ROLE.STOCK,
)
removePart(
  @Headers('x-workspace-id') workspaceId: string,
  @Param('partId') partId: string,
  @CurrentUser() user: { id: string },
) {
  return this.interventionsService.removePart(
    workspaceId,
    partId,
    user?.id,
  );
}

@Post('case/:caseId/proforma')
@Roles(
  USER_ROLE.ADMIN,
  USER_ROLE.RECEPTION,
  USER_ROLE.WORKSHOP,
)
generateProforma(
  @Headers('x-workspace-id') workspaceId: string,
  @Param('caseId') caseId: string
) {
  return this.interventionsService.generateProforma(workspaceId, caseId);
}

@Get('case/:caseId')
getCaseDetails(
  @Headers('x-workspace-id') workspaceId: string,
  @Param('caseId') caseId: string
) {
  return this.interventionsService.getCaseDetails(workspaceId, caseId);
}

@Post('case/:caseId/phase')
@Roles(
  USER_ROLE.ADMIN,
  USER_ROLE.WORKSHOP,
)
createNewPhase(
  @Headers('x-workspace-id') workspaceId: string,
  @Param('caseId') caseId: string,
  @Body('description') description: string
) {
  return this.interventionsService.createNewPhase(workspaceId, caseId, description);
}



}
