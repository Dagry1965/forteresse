import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { CreateClientContactDto } from './dto/create-client-contact.dto';
import { UpdateClientContactDto } from './dto/update-client-contact.dto';
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard';
import { WorkspaceGuard } from '../../core/auth/workspace.guard';
import { RolesGuard } from '../../core/auth/roles.guard';
import { Roles } from '../../core/auth/roles.decorator';
import { USER_ROLE } from '../../../../../shared/constants/status.constants';

@Controller('clients')
@UseGuards(JwtAuthGuard, WorkspaceGuard, RolesGuard)
@Roles(
  USER_ROLE.ADMIN,
  USER_ROLE.RECEPTION,
  USER_ROLE.WORKSHOP,
  USER_ROLE.MECHANIC,
  USER_ROLE.ACCOUNTING,
  USER_ROLE.READ_ONLY,
)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
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
  @Roles(
    USER_ROLE.ADMIN,
    USER_ROLE.RECEPTION,
  )
  create(
    @Headers('x-workspace-id') workspaceId: string,
    @Body() dto: CreateClientDto,
  ) {
    return this.clientsService.create(workspaceId, dto);
  }

  @Patch(':id')
  @Roles(
    USER_ROLE.ADMIN,
    USER_ROLE.RECEPTION,
  )
  update(
    @Headers('x-workspace-id') workspaceId: string,
    @Param('id') id: string,
    @Body() dto: UpdateClientDto,
  ) {
    return this.clientsService.update(workspaceId, id, dto);
  }


  @Post(':clientId/contacts')
  @Roles(
    USER_ROLE.ADMIN,
    USER_ROLE.RECEPTION,
  )
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
  @Roles(
    USER_ROLE.ADMIN,
    USER_ROLE.RECEPTION,
  )
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
  @Roles(
    USER_ROLE.ADMIN,
    USER_ROLE.RECEPTION,
  )
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
  @Roles(
    USER_ROLE.ADMIN,
    USER_ROLE.RECEPTION,
  )
  softDelete(
    @Headers('x-workspace-id') workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.clientsService.softDelete(workspaceId, id);
  }

  @Patch(':id/restore')
  @Roles(
    USER_ROLE.ADMIN,
    USER_ROLE.RECEPTION,
  )
  restore(
    @Headers('x-workspace-id') workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.clientsService.restore(workspaceId, id);
  }
}
