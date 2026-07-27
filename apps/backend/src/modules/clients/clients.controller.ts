import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { CreateClientContactDto } from './dto/create-client-contact.dto';
import { UpdateClientContactDto } from './dto/update-client-contact.dto';
import { USER_ROLE } from '../../../../../shared/constants/status.constants';

@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get(':workspaceId')
  findAll(@Param('workspaceId') workspaceId: string) {
    return this.clientsService.findAll(workspaceId);
  }

  @Get('one/:id')
  findOne(@Param('id') id: string) {
    return this.clientsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateClientDto) {
    return this.clientsService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateClientDto) {
    return this.clientsService.update(id, dto);
  }


  @Post(':clientId/contacts')
  createContact(
    @Param('clientId') clientId: string,
    @Body() dto: CreateClientContactDto,
  ) {
    return this.clientsService.createContact(clientId, dto);
  }

  @Patch(':clientId/contacts/:contactId')
  updateContact(
    @Param('clientId') clientId: string,
    @Param('contactId') contactId: string,
    @Body() dto: UpdateClientContactDto,
  ) {
    return this.clientsService.updateContact(clientId, contactId, dto);
  }

  @Delete(':clientId/contacts/:contactId')
  softDeleteContact(
    @Param('clientId') clientId: string,
    @Param('contactId') contactId: string,
  ) {
    return this.clientsService.softDeleteContact(clientId, contactId);
  }

  // === SOFT DELETE (accessible à tous) ===
  @Patch(':id/soft-delete')
  softDelete(@Param('id') id: string) {
    return this.clientsService.softDelete(id);
  }

  @Patch(':id/restore')
  restore(@Param('id') id: string) {
    return this.clientsService.restore(id);
  }

  // === HARD DELETE (uniquement Admin) ===
  @Delete(':id/hard')
 hardDelete(@Param('id') id: string, @Req() req: any) {
    // Vérification du rôle
    const user = req.user;

    const isAdmin =
      user?.role === USER_ROLE.ADMIN ||
      user?.roles?.includes(USER_ROLE.ADMIN);

    if (!user || !isAdmin) {
      throw new ForbiddenException('Accès réservé aux administrateurs');
    }

    return this.clientsService.hardDelete(id);
  }
}
