import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../core/prisma/prisma.service';
import {
  INVOICE_STATUS,
  PAYMENT_SCHEDULE_STATUS,
} from '../../../../../shared/constants/status.constants';

type RecordInvoicePaymentInput = {
  invoice_id: string;
  amount: number;
  method: string;
  user_id?: string;
  reference?: string;
  notes?: string;
  paid_at?: Date;
};

type RecordSchedulePaymentInput = {
  schedule_id: string;
  method: string;
  user_id?: string;
  reference?: string;
  notes?: string;
  paid_at?: Date;
};

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  private async resolveUserId(
    tx: Prisma.TransactionClient,
    workspaceId: string,
    requestedUserId?: string,
  ): Promise<string> {
    if (requestedUserId) {
      const requestedUser = await tx.user.findFirst({
        where: {
          id: requestedUserId,
          workspace_id: workspaceId,
          deleted_at: null,
        },
        select: { id: true },
      });

      if (requestedUser) {
        return requestedUser.id;
      }
    }

    const fallbackUser = await tx.user.findFirst({
      where: {
        workspace_id: workspaceId,
        deleted_at: null,
      },
      orderBy: { created_at: 'asc' },
      select: { id: true },
    });

    if (!fallbackUser) {
      throw new BadRequestException(
        'Aucun utilisateur valide pour enregistrer l’encaissement.',
      );
    }

    return fallbackUser.id;
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
        payments: {
          where: { deleted_at: null },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException('Facture introuvable.');
    }

    if (!invoice.client_id) {
      throw new BadRequestException(
        'La facture ne possède aucun client.',
      );
    }

    const amount = Number(input.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException(
        'Le montant doit être strictement supérieur à zéro.',
      );
    }

    const invoiceTotal = Number(invoice.total);
    const alreadyPaid = invoice.payments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0,
    );
    const remainingBeforePayment = Math.max(
      invoiceTotal - alreadyPaid,
      0,
    );

    if (remainingBeforePayment <= 0) {
      throw new BadRequestException(
        'Cette facture est déjà entièrement payée.',
      );
    }

    if (amount > remainingBeforePayment + 0.000001) {
      throw new BadRequestException(
        `Le montant dépasse le solde restant de ${remainingBeforePayment.toFixed(2)}.`,
      );
    }

    const finalUserId = await this.resolveUserId(
      tx,
      workspaceId,
      input.user_id,
    );

    const payment = await tx.payment.create({
      data: {
        workspace_id: workspaceId,
        invoice_id: invoice.id,
        client_id: invoice.client_id,
        user_id: finalUserId,
        amount,
        method: input.method?.trim() || 'especes',
        paid_at: input.paid_at ?? new Date(),
        reference: input.reference?.trim() || null,
        notes: input.notes?.trim() || null,
      },
    });

    const paidTotal = alreadyPaid + amount;
    const remaining = Math.max(invoiceTotal - paidTotal, 0);
    const status =
      remaining <= 0.000001
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
    }

    return {
      payment,
      invoice_id: invoice.id,
      invoice_total: invoiceTotal,
      paid_total: paidTotal,
      remaining,
      status,
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

    if (
      !Number.isInteger(installments)
      || installments <= 0
    ) {
      throw new BadRequestException(
        'Le nombre d’échéances doit être un entier positif.',
      );
    }

    if (
      !Number.isInteger(intervalDays)
      || intervalDays < 0
    ) {
      throw new BadRequestException(
        'L’intervalle entre les échéances est invalide.',
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
          payments: {
            where: { deleted_at: null },
          },
          paymentSchedules: true,
        },
      });

      if (!invoice) {
        throw new NotFoundException(
          'Facture introuvable.',
        );
      }

      if (invoice.paymentSchedules.length > 0) {
        throw new BadRequestException(
          'Un échéancier existe déjà pour cette facture.',
        );
      }

      const alreadyPaid = invoice.payments.reduce(
        (sum, payment) => sum + Number(payment.amount),
        0,
      );
      const remaining = Math.max(
        Number(invoice.total) - alreadyPaid,
        0,
      );

      if (remaining <= 0) {
        throw new BadRequestException(
          'Cette facture est déjà payée.',
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
        },
        include: {
          invoice: true,
        },
      });

      if (!schedule) {
        throw new NotFoundException(
          'Échéance introuvable.',
        );
      }

      if (
        schedule.status === PAYMENT_SCHEDULE_STATUS.PAID
      ) {
        throw new BadRequestException(
          'Cette échéance est déjà payée.',
        );
      }

      const result = await this.createPaymentInTransaction(
        tx,
        workspaceId,
        {
          invoice_id: schedule.invoice_id,
          amount: schedule.amount,
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
