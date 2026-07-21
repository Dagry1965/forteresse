import { Prisma } from '@prisma/client';
import { workspaceStore } from '../common/context.service';

const TENANT_MODELS = new Set([
  'User',
  'WorkspaceMember',
  'Client',
  'Vehicle',
  'TimeSlot',
  'Appointment',
  'Proforma',
  'Invoice',
  'Payment',
  'Intervention',
  'Supplier',
  'StockCategory',
  'StockItem',
  'StockMovement',
  'PurchaseOrder',
  'StockReception',
  'PurchaseReceipt',
  'Inventory',
  'RefreshToken',
  'Case',
  'NumberSequence',
  'PaymentSchedule',
]);

const FILTER_OPERATIONS = new Set([
  'findMany',
  'findFirst',
  'count',
  'updateMany',
  'deleteMany',
]);

export const prismaTenancyExtension = Prisma.defineExtension({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const workspaceId = workspaceStore.getStore();

        if (!workspaceId || !model || !TENANT_MODELS.has(model)) {
          return query(args);
        }

        if (FILTER_OPERATIONS.has(operation)) {
          args.where = {
            ...args.where,
            workspace_id: workspaceId,
          };
        }

        if (operation === 'create') {
          args.data = {
            ...args.data,
            workspace_id: workspaceId,
          };
        }

        return query(args);
      },
    },
  },
});