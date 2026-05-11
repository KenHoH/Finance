import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import express from 'express';
import { GlobalExceptionFilter } from './infrastructure/filters/http-exception.filter.js';
import { SanitizeInterceptor } from './infrastructure/interceptors/sanitize.interceptor.js';
import { CsrfGuard } from './infrastructure/guards/csrf.guard.js';

function addOrigin(allowedOrigins: Set<string>, value?: string) {
  if(!value) return;
  try{
    allowedOrigins.add(new URL(value).origin);
  }catch{}
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));

  const allowedOrigins = new Set<string>();
  addOrigin(allowedOrigins, process.env.FRONTEND_URL);
  process.env.ALLOWED_ORIGINS
    ?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
    .forEach((origin) => addOrigin(allowedOrigins, origin));

  if(process.env.NODE_ENV !== 'production'){
    allowedOrigins.add('http://localhost:3000');
    allowedOrigins.add('http://localhost:3001');
    allowedOrigins.add('http://localhost:5173');
    allowedOrigins.add('http://localhost:5174');
    allowedOrigins.add('http://127.0.0.1:5173');
    allowedOrigins.add('http://127.0.0.1:5174');
  }

  app.enableCors({
    origin: (origin, callback) => {
      if(!origin || allowedOrigins.has(origin)){
        callback(null, true);
      } else {
        callback(new Error(`Not allowed by CORS: ${origin}`));
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

  app.useGlobalGuards(new CsrfGuard());

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
