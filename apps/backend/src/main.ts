import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';

dotenv.config();

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const port = process.env.APP_PORT || '4000';
  await app.listen(Number(port));
  console.log(`Backend listening on ${port}`);
}

bootstrap();
