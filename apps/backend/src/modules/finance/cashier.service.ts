import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../core/prisma/prisma.service';
import { SchedulingService } from '../shared/scheduling.service';
import {
  CASH_MOVEMENT_TYPE,
  CASH_REGISTER_STATUS,
  PAYMENT_METHOD,
  PAYMENT_STATUS,
} from '../../../../../shared/constants/status.constants';

type PrismaClientLike =
  | PrismaService
  | Prisma.TransactionClient;

@Injectable()
export class CashierService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly schedulingService: SchedulingService,
  ) {}

  private async resolveUserId(
    prisma: PrismaClientLike,
    workspaceId: string,
    userId: string,
  ): Promise<string> {
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        workspace_id: workspaceId,
        deleted_at: null,
      },
      select: { id: true },
    });

    if (!user) {
      throw new BadRequestException(
        'Utilisateur invalide pour cette operation de caisse.',
      );
    }

    return user.id;
  }

  private async getOpenRegister(
    prisma: PrismaClientLike,
    workspaceId: string,
  ) {
    return prisma.cashRegister.findFirst({
      where: {
        workspace_id: workspaceId,
        status: CASH_REGISTER_STATUS.OPEN,
      },
      include: {
        openedBy: {
          select: { id: true, name: true },
        },
      },
      orderBy: { opened_at: 'desc' },
    });
  }

  private calculateExpectedAmount(
    openingAmount: number,
    movements: Array<{
      type: string;
      amount: number;
      method: string;
    }>,
  ): number {
    return movements.reduce((total, movement) => {
      if (movement.method !== PAYMENT_METHOD.CASH) {
        return total;
      }

      if (
        movement.type === CASH_MOVEMENT_TYPE.OPENING
        || movement.type === CASH_MOVEMENT_TYPE.PAYMENT
        || movement.type === CASH_MOVEMENT_TYPE.CASH_IN
      ) {
        return total + Number(movement.amount);
      }

      if (
        movement.type === CASH_MOVEMENT_TYPE.REFUND
        || movement.type === CASH_MOVEMENT_TYPE.CASH_OUT
      ) {
        return total - Number(movement.amount);
      }

      return total;
    }, openingAmount);
  }

  async openRegister(
    workspaceId: string,
    userId: string,
    openingAmountInput: number,
    notes?: string,
  ) {
    const openingAmount = Number(openingAmountInput);

    if (!Number.isFinite(openingAmount) || openingAmount < 0) {
      throw new BadRequestException(
        'Le fond de caisse est invalide.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const existing = await this.getOpenRegister(
        tx,
        workspaceId,
      );

      if (existing) {
        throw new BadRequestException(
          'Une caisse est deja ouverte pour ce workspace.',
        );
      }

      const finalUserId = await this.resolveUserId(
        tx,
        workspaceId,
        userId,
      );

      const register = await tx.cashRegister.create({
        data: {
          workspace_id: workspaceId,
          opened_by: finalUserId,
          status: CASH_REGISTER_STATUS.OPEN,
          opening_amount: openingAmount,
          opening_notes: notes?.trim() || null,
        },
      });

      await tx.cashMovement.create({
        data: {
          workspace_id: workspaceId,
          cash_register_id: register.id,
          user_id: finalUserId,
          type: CASH_MOVEMENT_TYPE.OPENING,
          method: PAYMENT_METHOD.CASH,
          amount: openingAmount,
          notes: notes?.trim() || 'Ouverture de caisse',
        },
      });

      return tx.cashRegister.findUnique({
        where: { id: register.id },
        include: {
          openedBy: {
            select: { id: true, name: true },
          },
          movements: {
            orderBy: { created_at: 'asc' },
          },
        },
      });
    });
  }

  async getActiveRegister(workspaceId: string) {
    const register = await this.prisma.cashRegister.findFirst({
      where: {
        workspace_id: workspaceId,
        status: CASH_REGISTER_STATUS.OPEN,
      },
      include: {
        openedBy: {
          select: { id: true, name: true },
        },
        movements: {
          include: {
            user: {
              select: { id: true, name: true },
            },
            payment: {
              select: {
                id: true,
                reference: true,
                status: true,
              },
            },
          },
          orderBy: { created_at: 'asc' },
        },
      },
      orderBy: { opened_at: 'desc' },
    });

    if (!register) {
      return null;
    }

    const expectedAmount = this.calculateExpectedAmount(
      0,
      register.movements,
    );

    return {
      ...register,
      expected_amount_live: expectedAmount,
    };
  }

  async createManualMovement(
    workspaceId: string,
    userId: string,
    type: string,
    amountInput: number,
    notes: string,
    reference?: string,
  ) {
    if (
      type !== CASH_MOVEMENT_TYPE.CASH_IN
      && type !== CASH_MOVEMENT_TYPE.CASH_OUT
    ) {
      throw new BadRequestException(
        'Le type de mouvement manuel est invalide.',
      );
    }

    const amount = Number(amountInput);

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException(
        'Le montant doit etre strictement positif.',
      );
    }

    const movementNotes = notes?.trim();

    if (!movementNotes) {
      throw new BadRequestException(
        'Le motif du mouvement est obligatoire.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const register = await this.getOpenRegister(
        tx,
        workspaceId,
      );

      if (!register) {
        throw new NotFoundException(
          'Aucune caisse ouverte.',
        );
      }

      const finalUserId = await this.resolveUserId(
        tx,
        workspaceId,
        userId,
      );

      return tx.cashMovement.create({
        data: {
          workspace_id: workspaceId,
          cash_register_id: register.id,
          user_id: finalUserId,
          type,
          method: PAYMENT_METHOD.CASH,
          amount,
          reference: reference?.trim() || null,
          notes: movementNotes,
        },
      });
    });
  }

  async closeRegister(
    workspaceId: string,
    userId: string,
    closingAmountInput: number,
    notes?: string,
  ) {
    const closingAmount = Number(closingAmountInput);

    if (!Number.isFinite(closingAmount) || closingAmount < 0) {
      throw new BadRequestException(
        'Le montant compte est invalide.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const register = await tx.cashRegister.findFirst({
        where: {
          workspace_id: workspaceId,
          status: CASH_REGISTER_STATUS.OPEN,
        },
        include: {
          movements: true,
        },
        orderBy: { opened_at: 'desc' },
      });

      if (!register) {
        throw new NotFoundException(
          'Aucune caisse ouverte.',
        );
      }

      const finalUserId = await this.resolveUserId(
        tx,
        workspaceId,
        userId,
      );

      const expectedAmount = this.calculateExpectedAmount(
        0,
        register.movements,
      );

      const difference = Number(
        (closingAmount - expectedAmount).toFixed(2),
      );

      await tx.cashMovement.create({
        data: {
          workspace_id: workspaceId,
          cash_register_id: register.id,
          user_id: finalUserId,
          type: CASH_MOVEMENT_TYPE.CLOSING,
          method: PAYMENT_METHOD.CASH,
          amount: closingAmount,
          notes: notes?.trim() || 'Cloture de caisse',
        },
      });

      return tx.cashRegister.update({
        where: { id: register.id },
        data: {
          status: CASH_REGISTER_STATUS.CLOSED,
          closed_by: finalUserId,
          closed_at: new Date(),
          expected_amount: expectedAmount,
          closing_amount: closingAmount,
          difference,
          closing_notes: notes?.trim() || null,
        },
        include: {
          openedBy: {
            select: { id: true, name: true },
          },
          closedBy: {
            select: { id: true, name: true },
          },
          movements: {
            orderBy: { created_at: 'asc' },
          },
        },
      });
    });
  }

  async getDailyReport(
    workspaceId: string,
    dateStr?: string,
  ) {
    const settings =
      await this.schedulingService.getBusinessSettings(
        workspaceId,
      );

    const dateKey =
      dateStr
      || this.schedulingService.getZonedDateKey(
        new Date(),
        settings.timezone,
      );

    const bounds =
      this.schedulingService.getZonedDayBounds(
        dateKey,
        settings.timezone,
      );

    const payments = await this.prisma.payment.findMany({
      where: {
        workspace_id: workspaceId,
        deleted_at: null,
        paid_at: {
          gte: bounds.start,
          lt: bounds.end,
        },
        invoice: {
          workspace_id: workspaceId,
          deleted_at: null,
        },
      },
      include: {
        invoice: {
          include: {
            client: true,
          },
        },
        user: {
          select: { name: true },
        },
      },
      orderBy: { paid_at: 'desc' },
    });

    const summary = payments.reduce(
      (acc, payment) => {
        const netAmount =
          payment.status === PAYMENT_STATUS.CANCELLED
            ? 0
            : Math.max(
                Number(payment.amount)
                  - Number(payment.refunded_amount),
                0,
              );

        if (!acc.byMethod[payment.method]) {
          acc.byMethod[payment.method] = 0;
        }

        acc.byMethod[payment.method] += netAmount;
        acc.totalGlobal += netAmount;

        return acc;
      },
      {
        byMethod: {} as Record<string, number>,
        totalGlobal: 0,
      },
    );

    const registers =
      await this.prisma.cashRegister.findMany({
        where: {
          workspace_id: workspaceId,
          opened_at: {
            gte: bounds.start,
            lt: bounds.end,
          },
        },
        include: {
          openedBy: {
            select: { name: true },
          },
          closedBy: {
            select: { name: true },
          },
        },
        orderBy: { opened_at: 'desc' },
      });

    return {
      date: dateKey,
      timezone: settings.timezone,
      count: payments.length,
      totals: summary.byMethod,
      grandTotal: summary.totalGlobal,
      registers,
      payments: payments.map((payment) => ({
        id: payment.id,
        time: payment.paid_at,
        amount: payment.amount,
        refundedAmount: payment.refunded_amount,
        netAmount:
          payment.status === PAYMENT_STATUS.CANCELLED
            ? 0
            : Math.max(
                Number(payment.amount)
                  - Number(payment.refunded_amount),
                0,
              ),
        status: payment.status,
        method: payment.method,
        client:
          payment.invoice?.client?.name
          || 'Client inconnu',
        invoiceRef: payment.invoice?.reference,
        processedBy:
          payment.user?.name
          || 'Systeme',
      })),
    };
  }
}
