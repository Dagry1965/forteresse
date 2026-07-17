import { Controller, Get, Post, Body, Headers, Param } from '@nestjs/common'; 
import { InvoicesService } from './invoices.service'; // Utilisez InvoicesService au lieu de FinanceService

@Controller('invoices')
export class InvoicesController {
  // Injectez le bon service qui contient la méthode findUnpaidInvoices
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  async findAll(@Headers('x-workspace-id') workspaceId: string) {
    return this.invoicesService.findAll(workspaceId);
  }

  @Get('unpaid')
  async getUnpaidInvoices(@Headers('x-workspace-id') workspaceId: string) {
    // Appelez la méthode du service au lieu de faire du Prisma ici
    return this.invoicesService.findUnpaidInvoices(workspaceId);
  }


@Post('fleet')
async createFleetInvoice(
  @Headers('x-workspace-id') workspaceId: string,
  @Body() dto: { client_id: string, appointment_ids: string[] }
) {
  return this.invoicesService.createGroupedInvoice(workspaceId, dto);
}


@Get(':id')
async findOne(
  @Param('id') id: string,
  @Headers('x-workspace-id') workspaceId: string
) {
  return this.invoicesService.findOne(id, workspaceId);
}

}
