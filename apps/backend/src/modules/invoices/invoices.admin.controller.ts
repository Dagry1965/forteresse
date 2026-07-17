import { Controller, Get, Headers } from '@nestjs/common';
import { InvoicesService } from './invoices.service';

@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get('unpaid')
  async getUnpaidInvoices(@Headers('x-workspace-id') workspaceId: string) {
    // On appelle la méthode que nous avons validée dans votre service
    return this.invoicesService.findUnpaidInvoices(workspaceId);
  }

  @Get()
  async findAll(@Headers('x-workspace-id') workspaceId: string) {
    return this.invoicesService.findAll(workspaceId);
  }
}
