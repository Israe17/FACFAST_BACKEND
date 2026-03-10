import cookieParser from 'cookie-parser';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpExceptionFilter } from './modules/common/filters/http-exception.filter';

export function configure_app(app: INestApplication): void {
  const config_service = app.get(ConfigService);
  const cors_origin = config_service.get<string>('app.cors_origin');

  app.use(cookieParser());
  app.enableCors({
    origin: cors_origin
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
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
}
