import { Prisma } from '@prisma/client';
import { workspaceStore } from '../common/context.service'; // On le crÃ©era juste aprÃ¨s

export const prismaTenancyExtension = Prisma.defineExtension({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const workspaceId = workspaceStore.getStore();

        // Si on est dans une opÃ©ration de lecture/Ã©criture et qu'on a un workspaceId
        if (workspaceId && ['findMany', 'findFirst', 'findUnique', 'count', 'update', 'updateMany', 'delete', 'deleteMany'].includes(operation)) {
          args.where = { ...args.where, workspaceId };
        }

        // Si on crÃ©e une donnÃ©e, on injecte automatiquement le workspaceId
        if (workspaceId && operation === 'create') {
          args.data = { ...args.data, workspaceId };
        }

        return query(args);
      },
    },
  },
});

