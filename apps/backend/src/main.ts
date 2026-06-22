import { NestFactory } from '@nestjs/core';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 🔥 Ajout du prefix global pour garder les routes /api/... côté frontend
  app.setGlobalPrefix('api');

  // CORS OK
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Validation + formatage des erreurs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      exceptionFactory: (errors) => {
        const messages = errors.map((error) => {
          return Object.values(error.constraints || {})[0];
        });
        return new BadRequestException(messages.join('. '));
      },
      stopAtFirstError: true,
    }),
  );

  const port = process.env.APP_PORT || '4000';
  await app.listen(Number(port));
  console.log(`Backend listening on ${port}`);
}

bootstrap();
