import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Включаем валидацию
  app.useGlobalPipes(new ValidationPipe());
  
  // Настраиваем CORS
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3001'], // Разрешаем доступ с localhost:3000 (бэкенд) и localhost:5173 (Vite)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true // Важно для работы с куками и заголовками авторизации
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
