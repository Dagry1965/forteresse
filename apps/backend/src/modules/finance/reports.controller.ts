import { Controller, Get, Query,Headers } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { ReportsService } from './reports.service';

@Controller('finance/reports')
export class ReportsController {
   constructor(
    private readonly reportsService: ReportsService,
    private readonly prisma: PrismaService,
  ) {}

  // ---------------------------------------------------------
  // PAYMENTS REPORT
  // ---------------------------------------------------------
  @Get('payments')
  async paymentsReport(
    @Query('workspaceId') workspaceId: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.prisma.payment.findMany({
      where: {
        invoice: {
          workspace_id: workspaceId,
        },
        created_at: {
          gte: from ? new Date(from) : undefined,
          lte: to ? new Date(to) : undefined,
        },
      },
      include: {
        invoice: {
          include: {
            client: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  // ---------------------------------------------------------
  // REVENUE REPORT
  // ---------------------------------------------------------
  @Get('revenue')
  async revenueReport(
    @Query('workspaceId') workspaceId: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    const invoices = await this.prisma.invoice.findMany({
      where: {
        workspace_id: workspaceId,
        created_at: {
          gte: from ? new Date(from) : undefined,
          lte: to ? new Date(to) : undefined,
        },
      },
      include: {
        payments: true,
      },
    });

    const totalRevenue = invoices.reduce(
      (sum, inv) => sum + inv.payments.reduce((s, p) => s + p.amount, 0),
      0,
    );

    return {
      totalRevenue,
      invoices,
    };
  }

 // ---------------------------------------------------------
  // DASHBORAD REPORTS
  // ---------------------------------------------------------

    @Get('dashboard-stats') 
  async getDashboardStats(@Headers('x-workspace-id') workspaceId: string) {
    const [turnover, topItems] = await Promise.all([
      this.reportsService.getTurnoverHistory(workspaceId),
      this.reportsService.getTopItems(workspaceId)
    ]);

    return { turnover, topItems };
  }

}

