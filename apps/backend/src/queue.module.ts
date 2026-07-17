import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule } from '@nestjs/config';

@Global()
@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: 'localhost',
        port: 6379,
        // Tu peux ajouter d'autres options si besoin :
        // password: process.env.REDIS_PASSWORD,
        // db: 0,
      },
    }),

    BullModule.registerQueue({
      name: 'main',            // Queue principale
    }),
  ],

  exports: [BullModule],
})
export class QueueModule {}