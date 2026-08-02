import { NestFactory } from '@nestjs/core';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { AppModule } from './app.module';
import { WorkspaceInterceptor } from './core/common/workspace.interceptor';
import * as dotenv from 'dotenv';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Préfixe global (important pour le frontend)
  app.setGlobalPrefix('api');

  // Intercepteur Multi-tenant
  app.useGlobalInterceptors(new WorkspaceInterceptor());

  // CORS limite aux origines explicitement autorisees.
  const allowedOrigins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (allowedOrigins.length === 0) {
    throw new Error(
      'CORS_ORIGINS doit contenir au moins une origine autorisee.',
    );
  }

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('Origine CORS non autorisee.'));
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Validation
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

  console.log(`🚀 Forteresse ERP Backend listening on port ${port}`);
  console.log(`🛡️  Multi-tenant Interceptor active`);

}

bootstrap();
