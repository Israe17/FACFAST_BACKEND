import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { configure_app } from './configure-app';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  configure_app(app);
  const config_service = app.get(ConfigService);
  const node_env = config_service.get<string>('NODE_ENV');

  if (node_env !== 'production') {
    const swagger_config = new DocumentBuilder()
      .setTitle('FastFact API')
      .setDescription(
        'Documentacion interactiva del backend para auth, users, rbac, branches, contacts e inventory.',
      )
      .setVersion('1.0.0')
      .addCookieAuth(
        'ff_access_token',
        {
          type: 'apiKey',
          in: 'cookie',
        },
        'access-cookie',
      )
      .addCookieAuth(
        'ff_refresh_token',
        {
          type: 'apiKey',
          in: 'cookie',
        },
        'refresh-cookie',
      )
      .build();

    const swagger_document = SwaggerModule.createDocument(app, swagger_config);
    SwaggerModule.setup('docs', app, swagger_document, {
      swaggerOptions: {
        persistAuthorization: true,
        requestInterceptor: (request: { credentials?: string }) => {
          request.credentials = 'include';
          return request;
        },
      },
    });
  }

  const port = config_service.get<number>('app.port', 3000);
  await app.listen(port);
}

void bootstrap();
