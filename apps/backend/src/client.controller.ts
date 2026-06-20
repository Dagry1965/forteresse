import { Controller, Get, Post, Body, Query, Param, Put, Delete } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { CreateClientDto } from './clients/dto/create-client.dto'; // Assure-toi que le fichier DTO est créé

@Controller('api/clients') // Ajout de 'api/' pour la cohérence avec PurchaseOrders et Auth
export class ClientController {
  constructor(private prisma: PrismaService) {}

  // 1. Créer un client (Sécurisé par DTO)
  @Post()
  async create(@Body() data: CreateClientDto) {
    return this.prisma.client.create({ data });
  }

  // 2. Lister les clients d'un garage avec leurs véhicules
  @Get()
  async findAll(@Query('workspaceId') workspaceId: string) {
    return this.prisma.client.findMany({ 
      where: { workspaceId }, 
      include: { vehicles: true },
      orderBy: { name: 'asc' } // Tri alphabétique pour plus de confort
    });
  }

  // 3. Récupérer un client spécifique par son ID
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.prisma.client.findUnique({
      where: { id },
      include: { vehicles: true }
    });
  }

  // 4. Modifier les informations d'un client
  @Put(':id')
  async update(@Param('id') id: string, @Body() data: Partial<CreateClientDto>) {
    return this.prisma.client.update({
      where: { id },
      data
    });
  }

  // 5. Supprimer un client
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.prisma.client.delete({
      where: { id }
    });
  }
}
