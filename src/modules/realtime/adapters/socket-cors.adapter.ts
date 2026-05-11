import { INestApplicationContext, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import type { Server, ServerOptions } from 'socket.io';

/**
 * Custom Socket.io adapter. Two responsibilities:
 *
 * 1. **CORS** — mirrors the express CORS config in configure-app.ts so
 *    the browser sends the httpOnly auth cookie on the WS upgrade. Same
 *    origins list, `credentials: true`. Without this the handshake
 *    reaches the gateway with no cookie header and auth fails.
 *
 * 2. **Multi-instance delivery** — when `REDIS_URL` is set, attaches
 *    the @socket.io/redis-adapter so room emits fan out across every
 *    Node process behind the load balancer. Without `REDIS_URL` we
 *    fall back to the in-memory adapter (single instance), which is
 *    the right default for local dev and small deployments.
 */
export class SocketCorsAdapter extends IoAdapter {
  private readonly logger = new Logger(SocketCorsAdapter.name);
  private readonly config_service: ConfigService;
  private redis_pub_client: Redis | null = null;
  private redis_sub_client: Redis | null = null;

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

    const server = super.createIOServer(port, {
      ...options,
      cors: {
        origin,
        credentials: true,
      },
    }) as Server;

    const redis_url = process.env.REDIS_URL?.trim();
    if (redis_url) {
      // Two clients are required: ioredis uses one for publishing and a
      // duplicated one for subscribing — the subscriber connection is
      // dedicated to the SUBSCRIBE command and cannot send other ops.
      this.redis_pub_client = new Redis(redis_url, {
        // Don't block app startup if Redis is briefly unavailable; the
        // adapter will reconnect in background. Realtime falls back to
        // single-instance delivery until the link is restored.
        lazyConnect: false,
        maxRetriesPerRequest: null,
      });
      this.redis_sub_client = this.redis_pub_client.duplicate();
      server.adapter(
        createAdapter(this.redis_pub_client, this.redis_sub_client),
      );
      this.logger.log(
        `Socket.io Redis adapter enabled (REDIS_URL=${redis_url})`,
      );
    } else {
      this.logger.log(
        'Socket.io running in-memory (single instance). Set REDIS_URL ' +
          'to enable cross-instance event delivery.',
      );
    }

    return server;
  }
}
