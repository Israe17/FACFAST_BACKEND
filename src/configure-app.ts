import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { build_validation_exception } from './modules/common/errors/validation-exception.factory';
import { HttpExceptionFilter } from './modules/common/filters/http-exception.filter';
import { request_context_middleware } from './modules/common/middleware/request-context.middleware';

export function configure_app(app: INestApplication): void {
  const config_service = app.get(ConfigService);
  const cors_origin = config_service.get<string>('app.cors_origin');
  const node_env = config_service.get<string>('NODE_ENV');

  // This is an API server (JSON + WebSocket), not an HTML host — there's
  // no document for the browser to apply CSP against. Helmet's default
  // CSP (`connect-src 'self'`) actively breaks the realtime WebSocket
  // upgrade in cross-origin deployments (frontend on app.example.com
  // talking to api.example.com) without protecting anything, so we
  // disable that one directive. All other helmet defaults stay: HSTS,
  // X-Content-Type-Options, X-Frame-Options, Referrer-Policy, etc. The
  // CSP that protects the user's browser is the responsibility of the
  // Next.js frontend that serves the HTML.
  app.use(helmet({ contentSecurityPolicy: false }));
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
