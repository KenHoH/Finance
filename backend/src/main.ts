import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import express from 'express';
import { GlobalExceptionFilter } from './infrastructure/filters/http-exception.filter.js';
import { SanitizeInterceptor } from './infrastructure/interceptors/sanitize.interceptor.js';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));

  const allowedOrigins = new Set<string>();
  const frontendUrl = process.env.FRONTEND_URL;
  if(frontendUrl){
    try{
      allowedOrigins.add(new URL(frontendUrl).origin);
    }catch{}
  }
  if(process.env.NODE_ENV !== 'production'){
    allowedOrigins.add('http://localhost:3000');
    allowedOrigins.add('http://localhost:3001');
  }

  app.enableCors({
    origin: (origin, callback) => {
      if(!origin || allowedOrigins.has(origin)){
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  });

  app.use(cookieParser());

  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new SanitizeInterceptor());

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  const config = new DocumentBuilder()
    .setTitle('Finance App API')
    .setDescription('Auth via cookie. Swagger UI langsung send the csrf-token cookie as X-CSRF-Token after login jadi bisa langsung tes.')
    .setVersion('1.0')
    .addTag('auth')
    .addTag('email')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory, {
    swaggerOptions: {
      persistAuthorization: true,
      requestInterceptor: (request: any) => {
        request.credentials = 'include';

        if(typeof document !== 'undefined'){
          const csrfToken = document.cookie
            .split('; ')
            .find((cookie) => cookie.startsWith('csrf-token='))
            ?.split('=')[1];

          if(csrfToken){
            request.headers = {
              ...request.headers,
              'X-CSRF-Token': decodeURIComponent(csrfToken),
            };
          }
        }

        return request;
      },
    },
  });
  
  
  await app.listen(process.env.PORT || 3000);
}
bootstrap();
