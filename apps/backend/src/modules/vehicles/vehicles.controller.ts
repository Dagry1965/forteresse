import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard';
import { WorkspaceGuard } from '../../core/auth/workspace.guard';
import { RolesGuard } from '../../core/auth/roles.guard';
import { Roles } from '../../core/auth/roles.decorator';
import { USER_ROLE } from '../../../../../shared/constants/status.constants';

@Controller('vehicles')
@UseGuards(JwtAuthGuard, WorkspaceGuard, RolesGuard)
@Roles(
  USER_ROLE.ADMIN,
  USER_ROLE.RECEPTION,
  USER_ROLE.WORKSHOP,
  USER_ROLE.MECHANIC,
  USER_ROLE.READ_ONLY,
)
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
  @Roles(
    USER_ROLE.ADMIN,
    USER_ROLE.RECEPTION,
  )
  create(
    @Headers('x-workspace-id') workspaceId: string,
    @Body() dto: CreateVehicleDto,
  ) {
    return this.vehiclesService.create(workspaceId, dto);
  }

  @Patch(':id')
  @Roles(
    USER_ROLE.ADMIN,
    USER_ROLE.RECEPTION,
  )
  update(
    @Headers('x-workspace-id') workspaceId: string,
    @Param('id') id: string,
    @Body() dto: UpdateVehicleDto,
  ) {
    return this.vehiclesService.update(workspaceId, id, dto);
  }

  // Soft Delete
  @Patch(':id/soft-delete')
  @Roles(
    USER_ROLE.ADMIN,
    USER_ROLE.RECEPTION,
  )
  softDelete(
    @Headers('x-workspace-id') workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.vehiclesService.softDelete(workspaceId, id);
  }

  // Restore
  @Patch(':id/restore')
  @Roles(
    USER_ROLE.ADMIN,
    USER_ROLE.RECEPTION,
  )
  restore(
    @Headers('x-workspace-id') workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.vehiclesService.restore(workspaceId, id);
  }
}
