const { PrismaClient } = require('@prisma/client');
const { PurchaseOrderService } = require('../purchase-order.service');

jest.mock('@prisma/client', () => {
  const actual = jest.requireActual('@prisma/client');
  return {
    ...actual,
    PrismaClient: jest.fn().mockImplementation(() => ({
      supplier: { findUnique: jest.fn() },
      product: { findMany: jest.fn() },
      purchaseOrder: { create: jest.fn() },
      $transaction: jest.fn(),
    })),
  };
});

describe('PurchaseOrderService', () => {
  let service;
  let prisma;

  beforeEach(() => {
    prisma = new PrismaClient();

    // Injection correcte dans le service
    service = new PurchaseOrderService(prisma);

    jest.clearAllMocks();
  });

  it('should create a purchase order with nested lines', async () => {
    prisma.supplier.findUnique.mockResolvedValue({ id: 'test-supplier-id' });
    prisma.product.findMany.mockResolvedValue([{ id: 'p1' }, { id: 'p2' }]);

    const created = { id: 'po1', lines: [{ id: 'l1' }, { id: 'l2' }] };
    prisma.$transaction.mockResolvedValue([created]);

    const dto = {
      workspaceId: 'ws1',
      supplierId: 'test-supplier-id',
      reference: 'PO-1',
      totalAmount: 25,
      lines: [
        { productId: 'p1', quantity: 1, unit_price: 10 },
        { productId: 'p2', quantity: 1, unit_price: 15 },
      ],
    };

    const res = await service.create(dto);

    expect(prisma.supplier.findUnique).toHaveBeenCalledWith({
      where: { id: dto.supplierId },
    });

    expect(prisma.product.findMany).toHaveBeenCalled();
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(res).toEqual(created);
  });

  it('should throw when supplier not found', async () => {
    prisma.supplier.findUnique.mockResolvedValue(null);

    const dto = {
      workspaceId: 'ws1',
      supplierId: 'missing',
      reference: 'PO-2',
      lines: [],
    };

    await expect(service.create(dto)).rejects.toMatchObject({
      response: { message: 'Supplier not found.' },
    });
  });

  it('should throw when some products missing', async () => {
    prisma.supplier.findUnique.mockResolvedValue({ id: 's' });

    prisma.product.findMany.mockResolvedValue([{ id: 'p1' }]); // p2 manquant

    const dto = {
      workspaceId: 'ws1',
      supplierId: 's',
      reference: 'PO-3',
      lines: [
        { productId: 'p1', quantity: 1, unit_price: 10 },
        { productId: 'p2', quantity: 1, unit_price: 15 },
      ],
    };

    await expect(service.create(dto)).rejects.toMatchObject({
      response: { message: expect.stringContaining('Product(s) not found') },
    });
  });
});
