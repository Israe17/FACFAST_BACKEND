import { Inject, Logger, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { parse as parse_cookies } from 'cookie';
import type { Server, Socket } from 'socket.io';

import type { JwtAccessPayload } from '../../common/interfaces/jwt-access-payload.interface';
import { UsersService } from '../../users/services/users.service';
import {
  REALTIME_NAMESPACE,
  build_business_room,
  build_user_room,
} from '../interfaces/socket-user-context.interface';

/**
 * Authenticates incoming socket connections by reading the same access
 * cookie used by the HTTP API (jwt-access strategy). On success the
 * socket joins two rooms — its own user room and its tenant room — so
 * RealtimeService can target either an individual operator or the whole
 * business with a single emit. On failure the socket is disconnected
 * before any client code runs.
 *
 * The JWT verification uses the same secret + cookie name as
 * JwtAccessStrategy (`auth.access_token_secret`,
 * `auth.access_cookie_name`), so a frontend that already has a valid
 * HTTP session connects without any extra ceremony.
 */
@WebSocketGateway({
  namespace: REALTIME_NAMESPACE,
  // CORS for sockets is configured via the custom adapter (see
  // SocketCorsAdapter) so we keep `withCredentials: true` consistent
  // with the express CORS config — no need to repeat origins here.
})
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwt_service: JwtService,
    private readonly config_service: ConfigService,
    @Inject(forwardRef(() => UsersService))
    private readonly users_service: UsersService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token = this.extract_token(client);
      if (!token) {
        client.disconnect(true);
        return;
      }

      const payload = await this.jwt_service.verifyAsync<JwtAccessPayload>(
        token,
        {
          secret: this.config_service.getOrThrow<string>(
            'auth.access_token_secret',
          ),
        },
      );

      const user = await this.users_service.get_authenticated_context(
        payload.sub,
        payload.business_id,
      );
      if (!user) {
        client.disconnect(true);
        return;
      }

      const user_room = build_user_room(user.id);
      const business_room = build_business_room(user.business_id);
      await client.join(user_room);
      await client.join(business_room);

      // socket.data is the canonical place to attach per-connection state
      // in Socket.io v4. Typing handled by SocketUserContext consumers.
      client.data.user = user;
      client.data.user_room = user_room;
      client.data.business_room = business_room;
    } catch (error) {
      // Reasons we get here: token expired, invalid signature, session
      // not found, user removed. Treat them all as "drop the socket
      // silently" — the client will retry and either succeed (after a
      // refresh) or stay disconnected (after a real logout).
      this.logger.debug(
        `Realtime handshake rejected: ${(error as Error).message}`,
      );
      client.disconnect(true);
    }
  }

  handleDisconnect(_client: Socket): void {
    // Nothing to clean up: rooms are released automatically when the
    // socket disconnects, and we don't keep any per-socket state outside
    // of socket.data.
  }

  private extract_token(client: Socket): string | null {
    const access_cookie_name = this.config_service.get<string>(
      'auth.access_cookie_name',
      'ff_access_token',
    );
    const cookie_header = client.handshake.headers.cookie;
    if (!cookie_header) return null;
    const cookies = parse_cookies(cookie_header);
    const token = cookies[access_cookie_name];
    return typeof token === 'string' && token.length > 0 ? token : null;
  }
}
