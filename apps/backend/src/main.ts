import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ CETTE PARTIE EST CRUCIALE POUR LE FRONTEND
  app.enableCors({
    origin: true, 
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  const port = process.env.APP_PORT || '4000';
  await app.listen(Number(port));
  console.log(`Backend listening on ${port}`);
}
bootstrap();
