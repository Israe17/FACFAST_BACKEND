import cookieParser from 'cookie-parser';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { build_validation_exception } from './modules/common/errors/validation-exception.factory';
import { HttpExceptionFilter } from './modules/common/filters/http-exception.filter';
import { request_context_middleware } from './modules/common/middleware/request-context.middleware';

export function configure_app(app: INestApplication): void {
  const config_service = app.get(ConfigService);
  const cors_origin = config_service.get<string>('app.cors_origin');
  const node_env = config_service.get<string>('NODE_ENV');

  app.use(cookieParser());
  app.use(request_context_middleware);
  app.enableCors({
    origin:
      node_env !== 'production'
        ? true
        : cors_origin
          ? cors_origin.split(',').map((origin) => origin.trim())
          : true,
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: build_validation_exception,
    }),
  );
  app.useGlobalFilters(app.get(HttpExceptionFilter));
}
