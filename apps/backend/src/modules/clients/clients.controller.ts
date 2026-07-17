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
      user?.role === 'ADMIN' || 
      user?.roles?.includes('ADMIN');

    if (!user || !isAdmin) {
      throw new ForbiddenException('Accès réservé aux administrateurs');
    }

    return this.clientsService.hardDelete(id);
  }
}