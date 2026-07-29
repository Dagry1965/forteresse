import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Req,
  ForbiddenException,
  UseGuards,
} from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { CreateClientContactDto } from './dto/create-client-contact.dto';
import { UpdateClientContactDto } from './dto/update-client-contact.dto';
import { USER_ROLE } from '../../../../../shared/constants/status.constants';
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard';
import { WorkspaceGuard } from '../../core/auth/workspace.guard';

@Controller('clients')
@UseGuards(JwtAuthGuard, WorkspaceGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get(':workspaceId')
  findAll(
    @Headers('x-workspace-id') workspaceId: string,
  ) {
    return this.clientsService.findAll(workspaceId);
  }

  @Get('one/:id')
  findOne(
    @Headers('x-workspace-id') workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.clientsService.findOne(workspaceId, id);
  }

  @Post()
  create(@Body() dto: CreateClientDto) {
    return this.clientsService.create(dto);
  }

  @Patch(':id')
  update(
    @Headers('x-workspace-id') workspaceId: string,
    @Param('id') id: string,
    @Body() dto: UpdateClientDto,
  ) {
    return this.clientsService.update(workspaceId, id, dto);
  }


  @Post(':clientId/contacts')
  createContact(
    @Headers('x-workspace-id') workspaceId: string,
    @Param('clientId') clientId: string,
    @Body() dto: CreateClientContactDto,
  ) {
    return this.clientsService.createContact(
      workspaceId,
      clientId,
      dto,
    );
  }

  @Patch(':clientId/contacts/:contactId')
  updateContact(
    @Headers('x-workspace-id') workspaceId: string,
    @Param('clientId') clientId: string,
    @Param('contactId') contactId: string,
    @Body() dto: UpdateClientContactDto,
  ) {
    return this.clientsService.updateContact(
      workspaceId,
      clientId,
      contactId,
      dto,
    );
  }

  @Delete(':clientId/contacts/:contactId')
  softDeleteContact(
    @Headers('x-workspace-id') workspaceId: string,
    @Param('clientId') clientId: string,
    @Param('contactId') contactId: string,
  ) {
    return this.clientsService.softDeleteContact(
      workspaceId,
      clientId,
      contactId,
    );
  }

  // === SOFT DELETE (accessible à tous) ===
  @Patch(':id/soft-delete')
  softDelete(
    @Headers('x-workspace-id') workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.clientsService.softDelete(workspaceId, id);
  }

  @Patch(':id/restore')
  restore(
    @Headers('x-workspace-id') workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.clientsService.restore(workspaceId, id);
  }

  // === HARD DELETE (uniquement Admin) ===
  @Delete(':id/hard')
  hardDelete(
    @Headers('x-workspace-id') workspaceId: string,
    @Param('id') id: string,
    @Req() req: any,
  ) {
    // Vérification du rôle
    const user = req.user;

    const isAdmin =
      user?.role === USER_ROLE.ADMIN ||
      user?.roles?.includes(USER_ROLE.ADMIN);

    if (!user || !isAdmin) {
      throw new ForbiddenException('Accès réservé aux administrateurs');
    }

    return this.clientsService.hardDelete(workspaceId, id);
  }
}
