import { PurchaseReceiptService } from '../../src/modules/inventory/purchase-receipt.service';
import { PrismaService } from '../../src/core/prisma/prisma.service';
import { SequencingService } from '../../src/modules/shared/sequencing.service';
import {
  PURCHASE_ORDER_STATUS,
  STOCK_MOVEMENT_TYPE,
} from '../../../../shared/constants/status.constants';

describe('PurchaseReceiptService', () => {
  it('enregistre une reception partielle et augmente le stock', async () => {
    const workspaceId = 'workspace-test';
    const purchaseOrderId = 'purchase-order-1';
    const orderItemId = 'purchase-order-item-1';
    const stockItemId = 'stock-item-1';
    const receiptId = 'receipt-1';

    const purchaseOrder = {
      id: purchaseOrderId,
      status: PURCHASE_ORDER_STATUS.SENT,
      supplier: {
        id: 'supplier-1',
        name: 'Fournisseur test',
      },
      items: [
        {
          id: orderItemId,
          item_id: stockItemId,
          quantity: 10,
          received_quantity: 0,
          item: {
            id: stockItemId,
            name: 'Filtre a huile',
            workspace_id: workspaceId,
            deleted_at: null,
          },
        },
      ],
    };

    const updatedOrder = {
      ...purchaseOrder,
      items: [
        {
          ...purchaseOrder.items[0],
          received_quantity: 4,
        },
      ],
    };

    const tx = {
      purchaseOrder: {
        findFirst: jest
          .fn()
          .mockResolvedValueOnce(purchaseOrder)
          .mockResolvedValueOnce(updatedOrder),
        update: jest.fn().mockResolvedValue({
          ...updatedOrder,
          status: PURCHASE_ORDER_STATUS.PARTIALLY_RECEIVED,
        }),
      },
      purchaseReceipt: {
        create: jest.fn().mockResolvedValue({
          id: receiptId,
          reference: 'REC-TEST-0001',
          workspace_id: workspaceId,
          purchase_order_id: purchaseOrderId,
        }),
        findUnique: jest.fn().mockResolvedValue({
          id: receiptId,
          reference: 'REC-TEST-0001',
          purchase_order: updatedOrder,
        }),
      },
      purchaseOrderItem: {
        findFirst: jest.fn().mockResolvedValue(
          purchaseOrder.items[0],
        ),
        update: jest.fn().mockResolvedValue({
          ...purchaseOrder.items[0],
          received_quantity: 4,
        }),
      },
      stockItem: {
        update: jest.fn().mockResolvedValue({
          ...purchaseOrder.items[0].item,
          quantity: 4,
        }),
      },
      stockMovement: {
        create: jest.fn().mockResolvedValue({
          id: 'movement-1',
        }),
      },
    };

    const prisma = {
      $transaction: jest.fn(
        async (
          callback: (
            transactionClient: typeof tx,
          ) => Promise<unknown>,
        ) => callback(tx),
      ),
    } as unknown as PrismaService;

    const sequencingService = {
      generateReference: jest
        .fn()
        .mockResolvedValue('REC-TEST-0001'),
    } as unknown as SequencingService;

    const service = new PurchaseReceiptService(
      prisma,
      sequencingService,
    );

    const result = await service.createReceipt(
      workspaceId,
      {
        purchaseOrderId,
        items: [
          {
            item_id: stockItemId,
            quantity: 4,
          },
        ],
        userId: 'user-1',
      },
    );

    expect(
      sequencingService.generateReference,
    ).toHaveBeenCalledWith(
      workspaceId,
      'RECEIPT',
    );

    expect(
      tx.purchaseOrderItem.update,
    ).toHaveBeenCalledWith({
      where: {
        id: orderItemId,
      },
      data: {
        received_quantity: {
          increment: 4,
        },
      },
    });

    expect(tx.stockItem.update).toHaveBeenCalledWith({
      where: {
        id: stockItemId,
      },
      data: {
        quantity: {
          increment: 4,
        },
      },
    });

    expect(
      tx.stockMovement.create,
    ).toHaveBeenCalledWith({
      data: {
        workspace_id: workspaceId,
        item_id: stockItemId,
        purchase_receipt_id: receiptId,
        quantity: 4,
        type: STOCK_MOVEMENT_TYPE.IN_PURCHASE,
        created_by: 'user-1',
      },
    });

    expect(tx.purchaseOrder.update).toHaveBeenCalledWith({
      where: {
        id: purchaseOrderId,
      },
      data: {
        status:
          PURCHASE_ORDER_STATUS.PARTIALLY_RECEIVED,
      },
    });

    expect(result).toEqual({
      id: receiptId,
      reference: 'REC-TEST-0001',
      purchase_order: updatedOrder,
    });
  });
});
