import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq'; // <-- Garde bullmq ici
import * as dotenv from 'dotenv';
import { ConfigModule, ConfigService } from '@nestjs/config'; // <-- IMPORTANT : Importer ConfigModule ici
dotenv.config();

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule], // Import ConfigModule pour qu'il soit accessible
      useFactory: async (configService: ConfigService) => {
        const redisUrl = configService.get('REDIS_URL');
        console.log(`[QueueModule] REDIS_URL from config: ${redisUrl}`); // Debugging
        
        if (!redisUrl) {
          console.error('[QueueModule] REDIS_URL not found in config. Using fallback localhost:6379.');
          return { redis: { host: 'localhost', port: 6379 } };
        }

        try {
          const url = new URL(redisUrl);
          console.log(`[QueueModule] Parsed Redis Host: ${url.hostname}, Port: ${parseInt(url.port, 10)}`); // Debugging
          return {
            redis: {
              host: url.hostname,
              port: parseInt(url.port, 10),
            },
          };
        } catch (error) {
          console.error(`[QueueModule] Error parsing REDIS_URL: ${redisUrl}. Falling back to localhost:6379.`, error);
          return { redis: { host: 'localhost', port: 6379 } };
        }
      },
      inject: [ConfigService], // Injecter ConfigService pour y accéder
    }),
  ],
})
export class QueueModule {}
