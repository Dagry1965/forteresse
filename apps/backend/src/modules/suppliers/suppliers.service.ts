import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

@Injectable()
export class SuppliersService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------
  // CREATE
  // ---------------------------------------------------------
  async create(dto: CreateSupplierDto) {
    return this.prisma.supplier.create({
      data: {
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        workspace: { connect: { id: dto.workspace_id } },
      },
    });
  }

  // ---------------------------------------------------------
  // FIND ALL
  // ---------------------------------------------------------
  async findAll(workspaceId?: string) {
    return this.prisma.supplier.findMany({
      where: workspaceId ? { workspace_id: workspaceId } : undefined,
      include: {
        items: true,
        purchaseOrders: true,
      },
    });
  }

  // ---------------------------------------------------------
  // FIND ONE
  // ---------------------------------------------------------
  async findOne(id: string, workspaceId: string) {
    return this.prisma.supplier.findFirst({
      where: { id, workspace_id: workspaceId },
      include: {
        items: true,
        purchaseOrders: true,
      },
    });
  }

  // ---------------------------------------------------------
  // UPDATE
  // ---------------------------------------------------------
  async update(id: string, workspaceId: string, dto: UpdateSupplierDto) {
    return this.prisma.supplier.update({
      where: { id },
      data: dto,
    });
  }

  // ---------------------------------------------------------
  // DELETE
  // ---------------------------------------------------------
  async remove(id: string) {
    return this.prisma.supplier.delete({
      where: { id },
    });
  }
}
