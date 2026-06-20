import { Controller, Post, Body, Get, Query, Param, Put, Delete, BadRequestException } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { CreateVehicleDto } from './vehicle/dto/create-vehicle.dto';

@Controller('api/vehicles')
export class VehicleController {
  constructor(private prisma: PrismaService) {}

  // 1. Créer un véhicule (Sécurisé par DTO)
  @Post()
  async create(@Body() data: CreateVehicleDto) {
    return this.prisma.vehicle.create({ data });
  }

  // 2. Lister les véhicules (avec le client propriétaire)
  @Get()
  async list(
    @Query('clientId') clientId?: string, 
    @Query('workspaceId') workspaceId?: string
  ) {
    return this.prisma.vehicle.findMany({
      where: {
        ...(clientId ? { clientId } : {}),
        ...(workspaceId ? { workspaceId } : {}),
      },
      include: { 
        client: true // On ramène le propriétaire
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  // 3. Récupérer un véhicule spécifique
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.prisma.vehicle.findUnique({
      where: { id },
      include: { client: true }
    });
  }

  // 4. Modifier un véhicule
  @Put(':id')
  async update(@Param('id') id: string, @Body() data: Partial<CreateVehicleDto>) {
    return this.prisma.vehicle.update({
      where: { id },
      data
    });
  }

  // 5. Supprimer un véhicule
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.prisma.vehicle.delete({
      where: { id }
    });
  }
}
