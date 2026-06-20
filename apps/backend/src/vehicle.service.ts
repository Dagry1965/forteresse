import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class VehicleService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    return this.prisma.vehicle.create({ data });
  }

  async findAll(workspaceId: string, clientId?: string) {
    return this.prisma.vehicle.findMany({
      where: { 
        workspaceId,
        ...(clientId ? { clientId } : {})
      },
      include: { client: true }
    });
  }
}
