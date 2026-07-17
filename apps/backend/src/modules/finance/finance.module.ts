import { Module } from '@nestjs/common';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';

import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

import { CashierController } from './cashier.controller';
import { CashierService } from './cashier.service';

import { PrismaService } from '../../core/prisma/prisma.service';

@Module({
  imports: [], // <-- Bonne pratique, même vide
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
    PrismaService,
  ],
  exports: [
    FinanceService,
    ReportsService,
    PaymentsService,
    CashierService,
  ],
})
export class FinanceModule {}
