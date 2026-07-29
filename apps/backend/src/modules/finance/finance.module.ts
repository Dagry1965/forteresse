import { Module } from '@nestjs/common';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';

import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

import { CashierController } from './cashier.controller';
import { CashierService } from './cashier.service';

import { PrismaModule } from '../../core/prisma/prisma.module';
import { AuthModule } from '../../core/auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [
    FinanceController,
    ReportsController,
    PaymentsController,
    CashierController,
  ],
  providers: [
    FinanceService,
    ReportsService,
    PaymentsService,
    CashierService,
  ],
  exports: [
    FinanceService,
    ReportsService,
    PaymentsService,
    CashierService,
  ],
})
export class FinanceModule {}
