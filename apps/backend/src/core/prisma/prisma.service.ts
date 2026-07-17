import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { softDeleteExtension } from './soft-delete.extension';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super();

    console.log("Resolved DB path =", require('path').resolve(
  process.env.DATABASE_URL!.replace('file:', '')

  
));

    // Application de l'extension Soft Delete
    // Tous les findMany, findUnique, findFirst et count excluent automatiquement les enregistrements supprimés
    return this.$extends(softDeleteExtension) as this;
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}