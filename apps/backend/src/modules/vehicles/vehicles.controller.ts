import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Get()
  findAll(@Query('workspaceId') workspaceId: string) {
    return this.vehiclesService.findAll(workspaceId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.vehiclesService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateVehicleDto) {
    return this.vehiclesService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateVehicleDto) {
    return this.vehiclesService.update(id, dto);
  }

  // Soft Delete
  @Patch(':id/soft-delete')
  softDelete(@Param('id') id: string) {
    return this.vehiclesService.softDelete(id);
  }

  // Restore
  @Patch(':id/restore')
  restore(@Param('id') id: string) {
    return this.vehiclesService.restore(id);
  }

  // Hard Delete (protégé plus tard)
  @Delete(':id/hard')
  hardDelete(@Param('id') id: string) {
    return this.vehiclesService.hardDelete(id);
  }
}