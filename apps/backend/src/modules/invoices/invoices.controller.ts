import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common'; 
import { InvoicesService } from './invoices.service';
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard';
import { WorkspaceGuard } from '../../core/auth/workspace.guard';
import { RolesGuard } from '../../core/auth/roles.guard';
import { Roles } from '../../core/auth/roles.decorator';
import { USER_ROLE } from '../../../../../shared/constants/status.constants'; // Utilisez InvoicesService au lieu de FinanceService

@Controller('invoices')
@UseGuards(JwtAuthGuard, WorkspaceGuard, RolesGuard)
@Roles(
  USER_ROLE.ADMIN,
  USER_ROLE.RECEPTION,
  USER_ROLE.CASHIER,
  USER_ROLE.ACCOUNTING,
  USER_ROLE.READ_ONLY,
)
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
@Roles(
  USER_ROLE.ADMIN,
  USER_ROLE.RECEPTION,
  USER_ROLE.ACCOUNTING,
)
async createFleetInvoice(
  @Headers('x-workspace-id') workspaceId: string,
  @Body() dto: { client_id: string, appointment_ids: string[] },
  @Req() req: any,
) {
  const userId = req.user?.id;

  if (!userId) {
    throw new UnauthorizedException(
      'Utilisateur authentifie introuvable.',
    );
  }

  return this.invoicesService.createGroupedInvoice(
    workspaceId,
    userId,
    dto,
  );
}


@Post(':id/credit-note')
@Roles(
  USER_ROLE.ADMIN,
  USER_ROLE.ACCOUNTING,
)
async createCreditNote(
  @Param('id') id: string,
  @Headers('x-workspace-id') workspaceId: string,
  @Body() dto: { reason?: string },
  @Req() req: any,
) {
  const userId = req.user?.id;

  if (!userId) {
    throw new UnauthorizedException(
      'Utilisateur authentifie introuvable.',
    );
  }

  return this.invoicesService.createCreditNote(
    workspaceId,
    id,
    userId,
    dto.reason,
  );
}


@Post(':id/cancel')
@Roles(
  USER_ROLE.ADMIN,
  USER_ROLE.ACCOUNTING,
)
async cancelInvoice(
  @Param('id') id: string,
  @Headers('x-workspace-id') workspaceId: string,
  @Body() dto: { reason?: string },
  @Req() req: any,
) {
  const userId = req.user?.id;

  if (!userId) {
    throw new UnauthorizedException(
      'Utilisateur authentifie introuvable.',
    );
  }

  return this.invoicesService.cancelInvoice(
    workspaceId,
    id,
    userId,
    dto.reason,
  );
}


@Get(':id')
async findOne(
  @Param('id') id: string,
  @Headers('x-workspace-id') workspaceId: string
) {
  return this.invoicesService.findOne(id, workspaceId);
}

}
