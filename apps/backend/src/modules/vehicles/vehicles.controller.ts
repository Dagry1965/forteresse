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
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { USER_ROLE } from '../../../../../shared/constants/status.constants';
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard';
import { WorkspaceGuard } from '../../core/auth/workspace.guard';

@Controller('vehicles')
@UseGuards(JwtAuthGuard, WorkspaceGuard)
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Get()
  findAll(@Headers('x-workspace-id') workspaceId: string) {
    return this.vehiclesService.findAll(workspaceId);
  }

  @Get(':id')
  findOne(
    @Headers('x-workspace-id') workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.vehiclesService.findOne(workspaceId, id);
  }

  @Post()
  create(
    @Headers('x-workspace-id') workspaceId: string,
    @Body() dto: CreateVehicleDto,
  ) {
    return this.vehiclesService.create(workspaceId, dto);
  }

  @Patch(':id')
  update(
    @Headers('x-workspace-id') workspaceId: string,
    @Param('id') id: string,
    @Body() dto: UpdateVehicleDto,
  ) {
    return this.vehiclesService.update(workspaceId, id, dto);
  }

  // Soft Delete
  @Patch(':id/soft-delete')
  softDelete(
    @Headers('x-workspace-id') workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.vehiclesService.softDelete(workspaceId, id);
  }

  // Restore
  @Patch(':id/restore')
  restore(
    @Headers('x-workspace-id') workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.vehiclesService.restore(workspaceId, id);
  }

  // Suppression définitive réservée aux administrateurs
  @Delete(':id/hard')
  hardDelete(
    @Headers('x-workspace-id') workspaceId: string,
    @Param('id') id: string,
    @Req() req: any,
  ) {
    const user = req.user;

    const isAdmin =
      user?.role === USER_ROLE.ADMIN ||
      user?.roles?.includes(USER_ROLE.ADMIN);

    if (!user || !isAdmin) {
      throw new ForbiddenException(
        'Accès réservé aux administrateurs',
      );
    }

    return this.vehiclesService.hardDelete(workspaceId, id);
  }
}