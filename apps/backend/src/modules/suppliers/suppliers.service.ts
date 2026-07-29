import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

@Injectable()
export class SuppliersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    workspaceId: string,
    dto: CreateSupplierDto,
  ) {
    return this.prisma.supplier.create({
      data: {
        name: dto.name.trim(),
        phone: dto.phone.trim(),
        email: dto.email.trim(),
        workspace: {
          connect: {
            id: workspaceId,
          },
        },
      },
    });
  }

  async findAll(workspaceId: string) {
    return this.prisma.supplier.findMany({
      where: {
        workspace_id: workspaceId,
      },
      include: {
        items: true,
        purchaseOrders: true,
      },
    });
  }

  async findOne(
    workspaceId: string,
    id: string,
  ) {
    const supplier = await this.prisma.supplier.findFirst({
      where: {
        id,
        workspace_id: workspaceId,
      },
      include: {
        items: true,
        purchaseOrders: true,
      },
    });

    if (!supplier) {
      throw new NotFoundException(
        'Fournisseur introuvable dans ce workspace.',
      );
    }

    return supplier;
  }

  async update(
    workspaceId: string,
    id: string,
    dto: UpdateSupplierDto,
  ) {
    await this.findOne(workspaceId, id);

    return this.prisma.supplier.update({
      where: {
        id,
      },
      data: {
        ...(dto.name !== undefined
          ? { name: dto.name.trim() }
          : {}),
        ...(dto.phone !== undefined
          ? { phone: dto.phone.trim() }
          : {}),
        ...(dto.email !== undefined
          ? { email: dto.email.trim() }
          : {}),
      },
    });
  }

  async remove(
    workspaceId: string,
    id: string,
  ) {
    await this.findOne(workspaceId, id);

    return this.prisma.supplier.delete({
      where: {
        id,
      },
    });
  }
}
