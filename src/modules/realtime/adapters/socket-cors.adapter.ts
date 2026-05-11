import { INestApplicationContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IoAdapter } from '@nestjs/platform-socket.io';
import type { Server, ServerOptions } from 'socket.io';

/**
 * Custom Socket.io adapter that mirrors the express CORS config in
 * configure-app.ts: same origins, `credentials: true` so the browser
 * sends the `ff_access_token` httpOnly cookie on the WS upgrade. Without
 * `credentials` here the handshake reaches the gateway with no cookie
 * header and the auth check fails.
 */
export class SocketCorsAdapter extends IoAdapter {
  private readonly config_service: ConfigService;

  constructor(app: INestApplicationContext) {
    super(app);
    this.config_service = app.get(ConfigService);
  }

  override createIOServer(
    port: number,
    options?: ServerOptions,
  ): Server {
    const cors_origin = this.config_service.get<string>('app.cors_origin');
    const node_env = this.config_service.get<string>('NODE_ENV');
    const origin =
      node_env !== 'production'
        ? true
        : cors_origin
          ? cors_origin.split(',').map((entry) => entry.trim())
          : true;

    return super.createIOServer(port, {
      ...options,
      cors: {
        origin,
        credentials: true,
      },
    }) as Server;
  }
}
