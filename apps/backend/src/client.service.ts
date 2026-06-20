import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class ClientService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    return this.prisma.client.create({ data });
  }

  async findAll(workspaceId: string) {
    return this.prisma.client.findMany({
      where: { workspaceId },
      include: { vehicles: true }
    });
  }
}
