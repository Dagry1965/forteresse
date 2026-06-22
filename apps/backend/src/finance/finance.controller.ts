import { Controller, Post, Body, Get, Query, Headers, BadRequestException } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PrismaService } from '../prisma/prisma.service';

@Controller('api/finance')
export class FinanceController {
  constructor(
    private readonly financeService: FinanceService,
    private readonly prisma: PrismaService
  ) {}

  // 1. Transformer un Devis en Facture
  @Post('invoices')
  async convertToInvoice(
    @Body() dto: CreateInvoiceDto,
    @Headers('x-workspace-id') workspaceId: string
  ) {
    if (!workspaceId) {
      throw new BadRequestException("L'identifiant de l'espace de travail (x-workspace-id) est requis.");
    }
    return this.financeService.createInvoice(dto, workspaceId);
  }

  // 2. Enregistrer un paiement (Caisse)
  @Post('payments')
  async registerPayment(@Body() dto: CreatePaymentDto) {
    return this.financeService.processPayment(dto);
  }

  // 3. Lister les factures impayées (Caisse)
  @Get('unpaid')
  async getUnpaidInvoices(@Query('workspaceId') workspaceId: string) {
    if (!workspaceId) {
      throw new BadRequestException("Le paramètre workspaceId est obligatoire.");
    }
    return this.financeService.findAllUnpaid(workspaceId);
  }

  // 4. Récupérer les logs d'audit (Dashboard)
  @Get('audit-logs')
  async getRecentLogs(@Query('workspaceId') workspaceId: string) {
    if (!workspaceId) {
      throw new BadRequestException("Le paramètre workspaceId est obligatoire pour l'audit.");
    }

    return this.prisma.auditLog.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },   // ✅ Corrigé : created_at → createdAt
      take: 10,
    });
  }
}