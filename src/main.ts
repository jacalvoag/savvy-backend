import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix para la API
  app.setGlobalPrefix('api');

  // Validación global de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,           // Remueve propiedades no definidas en DTOs
      forbidNonWhitelisted: true, // Lanza error si hay propiedades extra
      transform: true,            // Transforma payloads a instancias de DTO
    }),
  );

  // CORS para producción
  // En desarrollo: permite localhost
  // En producción: solo dominios específicos
  const allowedOrigins = process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:3000'];
  
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  // Puerto dinámico para diferentes entornos
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;
  
  // Importante: 0.0.0.0 para que Docker pueda rutear el tráfico
  await app.listen(port, '0.0.0.0');
  
  console.log(`\nSavvy backend running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`API Docs: http://localhost:${port}/api/docs\n`);
}

bootstrap();