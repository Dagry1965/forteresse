import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../core/prisma/prisma.service';
import { AuditService } from '../../core/audit/audit.service';
import {
  CASH_MOVEMENT_TYPE,
  CASH_REGISTER_STATUS,
  INVOICE_STATUS,
  PAYMENT_METHOD,
  PAYMENT_SCHEDULE_STATUS,
  PAYMENT_STATUS,
} from '../../../../../shared/constants/status.constants';

type RecordInvoicePaymentInput = {
  invoice_id: string;
  amount: number;
  method: string;
  user_id: string;
  reference?: string;
  notes?: string;
  paid_at?: Date;
};

type RecordSchedulePaymentInput = {
  schedule_id: string;
  method: string;
  user_id: string;
  reference?: string;
  notes?: string;
  paid_at?: Date;
};

const PAYMENT_METHOD_VALUES = Object.values(PAYMENT_METHOD);

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  private normalizePaymentMethod(method: string): string {
    const normalized = method?.trim().toUpperCase();

    if (!PAYMENT_METHOD_VALUES.includes(normalized as never)) {
      throw new BadRequestException(
        'Le moyen de paiement est invalide.',
      );
    }

    return normalized;
  }

  private getNetPaymentAmount(payment: {
    amount: Prisma.Decimal | number;
    refunded_amount: Prisma.Decimal | number;
    status: string;
    deleted_at: Date | null;
  }): number {
    if (
      payment.deleted_at
      || payment.status === PAYMENT_STATUS.CANCELLED
    ) {
      return 0;
    }

    return Math.max(
      Number(payment.amount) - Number(payment.refunded_amount),
      0,
    );
  }

  private async resolveUserId(
    tx: Prisma.TransactionClient,
    workspaceId: string,
    requestedUserId: string,
  ): Promise<string> {
    const requestedUser = await tx.user.findFirst({
      where: {
        id: requestedUserId,
        workspace_id: workspaceId,
        deleted_at: null,
      },
      select: { id: true },
    });

    if (!requestedUser) {
      throw new BadRequestException(
        'Utilisateur invalide pour enregistrer l encaissement.',
      );
    }

    return requestedUser.id;
  }

  private async getOpenCashRegister(
    tx: Prisma.TransactionClient,
    workspaceId: string,
  ) {
    return tx.cashRegister.findFirst({
      where: {
        workspace_id: workspaceId,
        status: CASH_REGISTER_STATUS.OPEN,
      },
      orderBy: { opened_at: 'desc' },
    });
  }

  private async recalculateInvoiceInTransaction(
    tx: Prisma.TransactionClient,
    workspaceId: string,
    invoiceId: string,
  ) {
    const invoice = await tx.invoice.findFirst({
      where: {
        id: invoiceId,
        workspace_id: workspaceId,
        deleted_at: null,
      },
      include: {
        payments: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException('Facture introuvable.');
    }

    const paidTotal = invoice.payments.reduce(
      (sum, payment) => sum + this.getNetPaymentAmount(payment),
      0,
    );

    const invoiceTotal = Number(invoice.total);
    const remaining = Math.max(invoiceTotal - paidTotal, 0);

    const status =
      paidTotal <= 0.000001
        ? INVOICE_STATUS.UNPAID
        : remaining <= 0.000001
          ? INVOICE_STATUS.PAID
          : INVOICE_STATUS.PARTIALLY_PAID;

    await tx.invoice.update({
      where: { id: invoice.id },
      data: {
        status,
        updated_at: new Date(),
      },
    });

    if (status === INVOICE_STATUS.PAID) {
      await tx.paymentSchedule.updateMany({
        where: {
          invoice_id: invoice.id,
          workspace_id: workspaceId,
          status: PAYMENT_SCHEDULE_STATUS.PENDING,
        },
        data: {
          status: PAYMENT_SCHEDULE_STATUS.PAID,
        },
      });
    } else {
      await tx.paymentSchedule.updateMany({
        where: {
          invoice_id: invoice.id,
          workspace_id: workspaceId,
          status: PAYMENT_SCHEDULE_STATUS.PAID,
        },
        data: {
          status: PAYMENT_SCHEDULE_STATUS.PENDING,
        },
      });
    }

    return {
      invoice_id: invoice.id,
      invoice_total: invoiceTotal,
      paid_total: paidTotal,
      remaining,
      status,
    };
  }

  private async createPaymentInTransaction(
    tx: Prisma.TransactionClient,
    workspaceId: string,
    input: RecordInvoicePaymentInput,
  ) {
    const invoice = await tx.invoice.findFirst({
      where: {
        id: input.invoice_id,
        workspace_id: workspaceId,
        deleted_at: null,
      },
      include: {
        payments: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException('Facture introuvable.');
    }

    if (!invoice.client_id) {
      throw new BadRequestException(
        'La facture ne possede aucun client.',
      );
    }

    const amount = Number(input.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException(
        'Le montant doit etre strictement superieur a zero.',
      );
    }

    const method = this.normalizePaymentMethod(input.method);

    const alreadyPaid = invoice.payments.reduce(
      (sum, payment) => sum + this.getNetPaymentAmount(payment),
      0,
    );

    const invoiceTotal = Number(invoice.total);
    const remainingBeforePayment = Math.max(
      invoiceTotal - alreadyPaid,
      0,
    );

    if (remainingBeforePayment <= 0.000001) {
      throw new BadRequestException(
        'Cette facture est deja entierement payee.',
      );
    }

    if (amount > remainingBeforePayment + 0.000001) {
      throw new BadRequestException(
        `Le montant depasse le solde restant de ${remainingBeforePayment.toFixed(2)}.`,
      );
    }

    const finalUserId = await this.resolveUserId(
      tx,
      workspaceId,
      input.user_id,
    );

    const cashRegister =
      method === PAYMENT_METHOD.CASH
        ? await this.getOpenCashRegister(tx, workspaceId)
        : null;

    if (method === PAYMENT_METHOD.CASH && !cashRegister) {
      throw new BadRequestException(
        'Une caisse doit etre ouverte pour enregistrer un paiement en especes.',
      );
    }

    const payment = await tx.payment.create({
      data: {
        workspace_id: workspaceId,
        invoice_id: invoice.id,
        client_id: invoice.client_id,
        user_id: finalUserId,
        cash_register_id: cashRegister?.id ?? null,
        amount,
        refunded_amount: 0,
        method,
        status: PAYMENT_STATUS.COMPLETED,
        paid_at: input.paid_at ?? new Date(),
        reference: input.reference?.trim() || null,
        notes: input.notes?.trim() || null,
      },
    });

    if (cashRegister) {
      await tx.cashMovement.create({
        data: {
          workspace_id: workspaceId,
          cash_register_id: cashRegister.id,
          payment_id: payment.id,
          user_id: finalUserId,
          type: CASH_MOVEMENT_TYPE.PAYMENT,
          method,
          amount,
          reference: payment.reference,
          notes: payment.notes,
        },
      });
    }

    const invoiceResult =
      await this.recalculateInvoiceInTransaction(
        tx,
        workspaceId,
        invoice.id,
      );

    await this.auditService.log(
      {
        action: 'PAYMENT_RECORDED',
        entity: 'Payment',
        entityId: payment.id,
        workspaceId,
        userId: finalUserId,
        newData: {
          invoiceId: invoice.id,
          amount: payment.amount,
          method: payment.method,
          status: payment.status,
          reference: payment.reference,
          cashRegisterId: payment.cash_register_id,
          invoiceStatus: invoiceResult.status,
          remaining: invoiceResult.remaining,
        },
      },
      tx,
    );

    return {
      payment,
      ...invoiceResult,
    };
  }

  async recordInvoicePayment(
    workspaceId: string,
    input: RecordInvoicePaymentInput,
  ) {
    if (!workspaceId) {
      throw new BadRequestException(
        'Le workspace est obligatoire.',
      );
    }

    return this.prisma.$transaction((tx) =>
      this.createPaymentInTransaction(
        tx,
        workspaceId,
        input,
      ),
    );
  }

  async cancelPayment(
    workspaceId: string,
    paymentId: string,
    userId: string,
    reason: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findFirst({
        where: {
          id: paymentId,
          workspace_id: workspaceId,
          deleted_at: null,
        },
      });

      if (!payment) {
        throw new NotFoundException('Paiement introuvable.');
      }

      if (payment.status === PAYMENT_STATUS.CANCELLED) {
        throw new BadRequestException(
          'Ce paiement est deja annule.',
        );
      }

      if (Number(payment.refunded_amount) > 0) {
        throw new BadRequestException(
          'Un paiement deja rembourse ne peut pas etre annule.',
        );
      }

      const finalUserId = await this.resolveUserId(
        tx,
        workspaceId,
        userId,
      );

      const cancellationReason = reason?.trim();

      if (!cancellationReason) {
        throw new BadRequestException(
          'Le motif d annulation est obligatoire.',
        );
      }

      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PAYMENT_STATUS.CANCELLED,
          cancelled_at: new Date(),
          notes: payment.notes
            ? `${payment.notes}\nANNULATION: ${cancellationReason}`
            : `ANNULATION: ${cancellationReason}`,
        },
      });

      if (
        payment.method === PAYMENT_METHOD.CASH
        && payment.cash_register_id
      ) {
        const register = await tx.cashRegister.findFirst({
          where: {
            id: payment.cash_register_id,
            workspace_id: workspaceId,
            status: CASH_REGISTER_STATUS.OPEN,
          },
        });

        if (!register) {
          throw new BadRequestException(
            'La caisse associee est fermee. Utilisez un remboursement.',
          );
        }

        await tx.cashMovement.create({
          data: {
            workspace_id: workspaceId,
            cash_register_id: register.id,
            payment_id: payment.id,
            user_id: finalUserId,
            type: CASH_MOVEMENT_TYPE.REFUND,
            method: PAYMENT_METHOD.CASH,
            amount: Number(payment.amount),
            reference: payment.reference,
            notes: `Annulation: ${cancellationReason}`,
          },
        });
      }

      const invoiceResult =
        await this.recalculateInvoiceInTransaction(
          tx,
          workspaceId,
          payment.invoice_id,
        );

      await this.auditService.log(
        {
          action: 'PAYMENT_CANCELLED',
          entity: 'Payment',
          entityId: payment.id,
          workspaceId,
          userId: finalUserId,
          oldData: {
            status: payment.status,
            amount: payment.amount,
            refundedAmount: payment.refunded_amount,
          },
          newData: {
            status: updatedPayment.status,
            reason: cancellationReason,
            invoiceStatus: invoiceResult.status,
            remaining: invoiceResult.remaining,
          },
        },
        tx,
      );

      return {
        payment: updatedPayment,
        ...invoiceResult,
      };
    });
  }

  async refundPayment(
    workspaceId: string,
    paymentId: string,
    userId: string,
    amountInput: number,
    reason: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findFirst({
        where: {
          id: paymentId,
          workspace_id: workspaceId,
          deleted_at: null,
        },
      });

      if (!payment) {
        throw new NotFoundException('Paiement introuvable.');
      }

      if (payment.status === PAYMENT_STATUS.CANCELLED) {
        throw new BadRequestException(
          'Un paiement annule ne peut pas etre rembourse.',
        );
      }

      const amount = Number(amountInput);
      const refundable =
        Number(payment.amount) - Number(payment.refunded_amount);

      if (!Number.isFinite(amount) || amount <= 0) {
        throw new BadRequestException(
          'Le montant du remboursement est invalide.',
        );
      }

      if (amount > refundable + 0.000001) {
        throw new BadRequestException(
          `Le remboursement depasse le montant disponible de ${refundable.toFixed(2)}.`,
        );
      }

      const refundReason = reason?.trim();

      if (!refundReason) {
        throw new BadRequestException(
          'Le motif du remboursement est obligatoire.',
        );
      }

      const finalUserId = await this.resolveUserId(
        tx,
        workspaceId,
        userId,
      );

      const newRefundedAmount =
        Number(payment.refunded_amount) + amount;

      const fullyRefunded =
        newRefundedAmount >= Number(payment.amount) - 0.000001;

      let cashRegisterId: string | null = null;

      if (payment.method === PAYMENT_METHOD.CASH) {
        const openRegister =
          await this.getOpenCashRegister(tx, workspaceId);

        if (!openRegister) {
          throw new BadRequestException(
            'Une caisse doit etre ouverte pour rembourser un paiement en especes.',
          );
        }

        cashRegisterId = openRegister.id;
      }

      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          refunded_amount: newRefundedAmount,
          refunded_at: new Date(),
          status: fullyRefunded
            ? PAYMENT_STATUS.REFUNDED
            : PAYMENT_STATUS.PARTIALLY_REFUNDED,
          notes: payment.notes
            ? `${payment.notes}\nREMBOURSEMENT ${amount.toFixed(2)}: ${refundReason}`
            : `REMBOURSEMENT ${amount.toFixed(2)}: ${refundReason}`,
        },
      });

      if (cashRegisterId) {
        await tx.cashMovement.create({
          data: {
            workspace_id: workspaceId,
            cash_register_id: cashRegisterId,
            payment_id: payment.id,
            user_id: finalUserId,
            type: CASH_MOVEMENT_TYPE.REFUND,
            method: PAYMENT_METHOD.CASH,
            amount,
            reference: payment.reference,
            notes: refundReason,
          },
        });
      }

      const invoiceResult =
        await this.recalculateInvoiceInTransaction(
          tx,
          workspaceId,
          payment.invoice_id,
        );

      const refundableRemaining = Math.max(
        Number(payment.amount) - newRefundedAmount,
        0,
      );

      await this.auditService.log(
        {
          action: 'PAYMENT_REFUNDED',
          entity: 'Payment',
          entityId: payment.id,
          workspaceId,
          userId: finalUserId,
          oldData: {
            status: payment.status,
            refundedAmount: payment.refunded_amount,
          },
          newData: {
            status: updatedPayment.status,
            refundedNow: amount,
            refundedAmount: newRefundedAmount,
            refundableRemaining,
            reason: refundReason,
            invoiceStatus: invoiceResult.status,
            remaining: invoiceResult.remaining,
          },
        },
        tx,
      );

      return {
        payment: updatedPayment,
        refunded_now: amount,
        refundable_remaining: refundableRemaining,
        ...invoiceResult,
      };
    });
  }

  async createPaymentSchedule(
    workspaceId: string,
    dto: {
      invoice_id: string;
      installments: number;
      interval_days: number;
    },
  ) {
    const installments = Number(dto.installments);
    const intervalDays = Number(dto.interval_days);

    if (!Number.isInteger(installments) || installments <= 0) {
      throw new BadRequestException(
        'Le nombre d echeances doit etre un entier positif.',
      );
    }

    if (!Number.isInteger(intervalDays) || intervalDays < 0) {
      throw new BadRequestException(
        'L intervalle entre les echeances est invalide.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findFirst({
        where: {
          id: dto.invoice_id,
          workspace_id: workspaceId,
          deleted_at: null,
        },
        include: {
          payments: true,
          paymentSchedules: true,
        },
      });

      if (!invoice) {
        throw new NotFoundException('Facture introuvable.');
      }

      if (invoice.paymentSchedules.length > 0) {
        throw new BadRequestException(
          'Un echeancier existe deja pour cette facture.',
        );
      }

      const alreadyPaid = invoice.payments.reduce(
        (sum, payment) => sum + this.getNetPaymentAmount(payment),
        0,
      );

      const remaining = Math.max(
        Number(invoice.total) - alreadyPaid,
        0,
      );

      if (remaining <= 0.000001) {
        throw new BadRequestException(
          'Cette facture est deja payee.',
        );
      }

      const baseAmount = Number(
        (remaining / installments).toFixed(2),
      );

      const schedules = [];
      let allocated = 0;

      for (let index = 0; index < installments; index += 1) {
        const dueDate = new Date();
        dueDate.setDate(
          dueDate.getDate() + index * intervalDays,
        );

        const amount =
          index === installments - 1
            ? Number((remaining - allocated).toFixed(2))
            : baseAmount;

        allocated += amount;

        schedules.push({
          invoice_id: invoice.id,
          workspace_id: workspaceId,
          amount,
          due_date: dueDate,
          status: PAYMENT_SCHEDULE_STATUS.PENDING,
        });
      }

      await tx.paymentSchedule.createMany({
        data: schedules,
      });

      return tx.paymentSchedule.findMany({
        where: {
          invoice_id: invoice.id,
          workspace_id: workspaceId,
        },
        orderBy: { due_date: 'asc' },
      });
    });
  }

  async getOverdueSchedules(workspaceId: string) {
    return this.prisma.paymentSchedule.findMany({
      where: {
        workspace_id: workspaceId,
        status: PAYMENT_SCHEDULE_STATUS.PENDING,
        due_date: { lt: new Date() },
        invoice: {
          deleted_at: null,
        },
      },
      include: {
        invoice: {
          include: {
            client: true,
            appointment: {
              include: { vehicle: true },
            },
          },
        },
      },
      orderBy: { due_date: 'asc' },
    });
  }

  async recordPayment(
    workspaceId: string,
    dto: RecordSchedulePaymentInput,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const schedule = await tx.paymentSchedule.findFirst({
        where: {
          id: dto.schedule_id,
          workspace_id: workspaceId,
          invoice: {
            deleted_at: null,
          },
        },
      });

      if (!schedule) {
        throw new NotFoundException(
          'Echeance introuvable.',
        );
      }

      if (schedule.status === PAYMENT_SCHEDULE_STATUS.PAID) {
        throw new BadRequestException(
          'Cette echeance est deja payee.',
        );
      }

      const result = await this.createPaymentInTransaction(
        tx,
        workspaceId,
        {
          invoice_id: schedule.invoice_id,
          amount: Number(schedule.amount),
          method: dto.method,
          user_id: dto.user_id,
          reference: dto.reference,
          notes: dto.notes,
          paid_at: dto.paid_at,
        },
      );

      await tx.paymentSchedule.update({
        where: { id: schedule.id },
        data: {
          status: PAYMENT_SCHEDULE_STATUS.PAID,
        },
      });

      return {
        ...result,
        schedule_id: schedule.id,
      };
    });
  }
}
