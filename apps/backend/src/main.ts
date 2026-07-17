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

  // CORS
  app.enableCors({
    origin: true,
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

  // =============================================
  // ✅ LOG DES ROUTES (à enlever après debug)
  // =============================================
  const server = app.getHttpAdapter().getInstance();
  const router = server._router || server.router;

  const routes = router.stack
    .filter((layer: any) => layer.route)
    .map((layer: any) => {
      const method = Object.keys(layer.route.methods)[0].toUpperCase();
      return `${method} ${layer.route.path}`;
    });

  console.log('\n=== 📍 Routes disponibles ===');
  routes.forEach((route: string) => console.log(route));
  console.log('================================\n');
  // =============================================
}

bootstrap();