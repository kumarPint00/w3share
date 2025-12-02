import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupSwagger } from './swaggers/swagger.setup';
import * as express from 'express';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

const PORT = process.env.PORT || 3010;

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: false });


  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));


  const rawOrigins =
    process.env.CORS_ORIGINS ||
    process.env.FRONTEND_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'http://localhost:3000' ||  'https://doge.aeologic.in' || 'https://w3share.vercel.app';

  const allowedOrigins = rawOrigins
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(
        Object.assign(new Error(`CORS not allowed from ${origin}`), {
          status: 403,
          toJSON: () => ({
            error: 'CORS_FORBIDDEN',
            message: `Origin ${origin} is not allowed`,
          }),
        }),
        false,
      );
    },
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    credentials: true,
  });

  app.useGlobalFilters(new AllExceptionsFilter());

  setupSwagger(app);

  await app.listen(PORT);
  console.log(`Application is running on: http://localhost:${PORT}`);
  console.log(`Swagger docs available at: http://localhost:${PORT}/docs`);
  console.log(`CORS allowed origins: ${allowedOrigins.join(', ') || 'none'}`);
}

bootstrap();
