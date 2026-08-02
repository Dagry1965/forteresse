import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Headers,
  UseGuards,
  NotFoundException,
  UnauthorizedException,
  Req,
} from '@nestjs/common';
import { ProformasService } from './proformas.service';
import { WorkspaceGuard } from '../../core/auth/workspace.guard';
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard';
import { RolesGuard } from '../../core/auth/roles.guard';
import { Roles } from '../../core/auth/roles.decorator';
import { USER_ROLE } from '../../../../../shared/constants/status.constants';
import { CreateProformaLineDto } from './dto/create-proforma-line.dto';
import { UpdateProformaLineDto } from './dto/update-proforma-line.dto';

@Controller('proformas')
@UseGuards(JwtAuthGuard, WorkspaceGuard, RolesGuard)
@Roles(
  USER_ROLE.ADMIN,
  USER_ROLE.RECEPTION,
  USER_ROLE.ACCOUNTING,
  USER_ROLE.READ_ONLY,
)
export class ProformasController {
  constructor(private readonly proformasService: ProformasService) {}

  @Get()
  findAll(@Headers('x-workspace-id') workspaceId: string) {
    return this.proformasService.findAll(workspaceId);
  }

  @Get(':id')
  async findOne(
    @Headers('x-workspace-id') workspaceId: string,
    @Param('id') id: string
  ) {
    const proforma = await this.proformasService.findOne(workspaceId, id);
    if (!proforma) throw new NotFoundException('Proforma introuvable');
    return proforma;
  }

  @Post(':id/lines')
@Roles(
  USER_ROLE.ADMIN,
  USER_ROLE.RECEPTION,
  USER_ROLE.ACCOUNTING,
)
  addLine(
    @Headers('x-workspace-id') workspaceId: string,
    @Param('id') id: string,
    @Body() dto: CreateProformaLineDto,
  ) {
    return this.proformasService.addLine(
      workspaceId,
      id,
      dto,
    );
  }

  @Patch(':id/lines/:lineId')
@Roles(
  USER_ROLE.ADMIN,
  USER_ROLE.RECEPTION,
  USER_ROLE.ACCOUNTING,
)
  updateLine(
    @Headers('x-workspace-id') workspaceId: string,
    @Param('id') id: string,
    @Param('lineId') lineId: string,
    @Body() dto: UpdateProformaLineDto,
  ) {
    return this.proformasService.updateLine(
      workspaceId,
      id,
      lineId,
      dto,
    );
  }

  @Delete(':id/lines/:lineId')
@Roles(
  USER_ROLE.ADMIN,
  USER_ROLE.RECEPTION,
  USER_ROLE.ACCOUNTING,
)
  removeLine(
    @Headers('x-workspace-id') workspaceId: string,
    @Param('id') id: string,
    @Param('lineId') lineId: string,
  ) {
    return this.proformasService.removeLine(
      workspaceId,
      id,
      lineId,
    );
  }

  // Route pour transformer le devis en facture
  @Post(':id/accept')
@Roles(
  USER_ROLE.ADMIN,
  USER_ROLE.RECEPTION,
  USER_ROLE.ACCOUNTING,
)
  acceptProforma(
    @Headers('x-workspace-id') workspaceId: string,
    @Param('id') id: string
  ) {
    return this.proformasService.acceptProforma(workspaceId, id);
  }

  @Post(':id/invoice')
@Roles(
  USER_ROLE.ADMIN,
  USER_ROLE.RECEPTION,
  USER_ROLE.ACCOUNTING,
)
  convertToInvoice(
    @Headers('x-workspace-id') workspaceId: string,
    @Param('id') id: string,
    @Req() req: any,
  ) {
    const userId = req.user?.id;

    if (!userId) {
      throw new UnauthorizedException(
        'Utilisateur authentifie introuvable.',
      );
    }

    return this.proformasService.convertToInvoice(
      workspaceId,
      id,
      userId,
    );
  }
}
