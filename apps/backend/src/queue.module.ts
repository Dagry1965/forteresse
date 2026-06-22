import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    BullModule.forRootAsync({
      useFactory: async (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL');

        console.log(`[QueueModule] REDIS_URL from config: ${redisUrl}`);

        // ✅ Protection : éviter new URL(undefined)
        if (!redisUrl) {
          console.error(
            `[QueueModule] REDIS_URL is undefined. Falling back to localhost:6379.`
          );
          return {
            redis: {
              host: 'localhost',
              port: 6379,
            },
          };
        }

        try {
          const url = new URL(redisUrl);

          console.log(
            `[QueueModule] Parsed Redis Host: ${url.hostname}, Port: ${parseInt(
              url.port,
              10
            )}`
          );

          return {
            redis: {
              host: url.hostname,
              port: parseInt(url.port, 10),
            },
          };
        } catch (error) {
          console.error(
            `[QueueModule] Error parsing REDIS_URL: ${redisUrl}. Falling back to localhost:6379.`,
            error
          );

          return {
            redis: {
              host: 'localhost',
              port: 6379,
            },
          };
        }
      },
      inject: [ConfigService],
    }),
  ],
})
export class QueueModule {}
