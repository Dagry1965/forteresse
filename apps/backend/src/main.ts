import { NestFactory } from '@nestjs/core';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
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

  // ✅ ACTIVATION ET FORMATAGE GÉNÉRIQUE DES ERREURS
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: false,
    
    // Transforme le tableau d'erreurs en un message texte simple
    exceptionFactory: (errors) => {
      const messages = errors.map((error) => {
        // On récupère la première contrainte violée pour chaque champ
        return Object.values(error.constraints || {})[0];
      });
      // Renvoie une erreur 400 avec les messages joints proprement
      return new BadRequestException(messages.join('. '));
    },
    
    // S'arrête à la première erreur pour éviter les messages trop longs
    stopAtFirstError: true, 
  }));

  const port = process.env.APP_PORT || '4000';
  await app.listen(Number(port));
  console.log(`Backend listening on ${port}`);
}
bootstrap();
