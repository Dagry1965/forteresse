import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Headers } from '@nestjs/common';
import { InterventionsService } from './interventions.service';
import { CreateInterventionDto } from './dto/create-intervention.dto';
import { UpdateInterventionDto } from './dto/update-intervention.dto';
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard';
import { WorkspaceGuard } from '../../core/auth/workspace.guard';
import { CurrentUser } from '../../core/auth/current-user.decorator';

@Controller('workshop/interventions')
@UseGuards(JwtAuthGuard, WorkspaceGuard)
export class InterventionsController {
  constructor(private readonly interventionsService: InterventionsService) {}

  @Post()
  create(
    @Headers('x-workspace-id') workspaceId: string,
    @Body() dto: CreateInterventionDto
  ) {
    return this.interventionsService.create(workspaceId, dto);
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
  update(
    @Headers('x-workspace-id') workspaceId: string,
    @Param('id') id: string,
    @Body() dto: UpdateInterventionDto
  ) {
    return this.interventionsService.update(workspaceId, id, dto);
  }

  @Delete(':id')
  remove(
    @Headers('x-workspace-id') workspaceId: string,
    @Param('id') id: string
  ) {
    return this.interventionsService.remove(workspaceId, id);
  }

  @Post(':id/parts')
addPart(
  @Headers('x-workspace-id') workspaceId: string,
  @Param('id') interventionId: string,
  @Body() dto: { item_id: string; quantity: number }
) {
  return this.interventionsService.addPart(workspaceId, interventionId, dto);
}

@Delete('parts/:partId')
removePart(
  @Headers('x-workspace-id') workspaceId: string,
  @Param('partId') partId: string
) {
  return this.interventionsService.removePart(workspaceId, partId);
}

@Post('case/:caseId/proforma')
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
createNewPhase(
  @Headers('x-workspace-id') workspaceId: string,
  @Param('caseId') caseId: string,
  @Body('description') description: string
) {
  return this.interventionsService.createNewPhase(workspaceId, caseId, description);
}



}
