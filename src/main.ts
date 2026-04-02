import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS para producción
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? '*',
    credentials: true,
  });

  // Puerto dinámico para Render
  const port = process.env.PORT ?? 4000;
  await app.listen(port, '0.0.0.0'); // ← Importante: 0.0.0.0
  
  console.log(`🚀 Savvy backend running on port ${port}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV}`);
}

bootstrap();
