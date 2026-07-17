import { Prisma } from '@prisma/client';

export const softDeleteExtension = Prisma.defineExtension((client) => {
  return client.$extends({
    name: 'softDelete',
  });
});