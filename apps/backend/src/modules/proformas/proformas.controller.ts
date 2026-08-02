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
import { CreateProformaLineDto } from './dto/create-proforma-line.dto';
import { UpdateProformaLineDto } from './dto/update-proforma-line.dto';

@Controller('proformas')
@UseGuards(JwtAuthGuard, WorkspaceGuard)
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
  acceptProforma(
    @Headers('x-workspace-id') workspaceId: string,
    @Param('id') id: string
  ) {
    return this.proformasService.acceptProforma(workspaceId, id);
  }

  @Post(':id/invoice')
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
