import { Injectable } from '@nestjs/common';

import {
  REALTIME_EVENTS,
  type RealtimeEventName,
  type RealtimeEventPayloads,
} from '../contracts/realtime-events';
import { RealtimeGateway } from '../gateways/realtime.gateway';
import {
  build_business_room,
  build_user_room,
} from '../interfaces/socket-user-context.interface';

/**
 * Type-safe facade other modules consume to push events to clients. Use
 * this — never inject the gateway directly — so realtime emission stays
 * uncoupled from the socket implementation. If we ever swap Socket.io
 * for SSE / a message bus, only this file changes.
 *
 * All emit methods are non-blocking and tolerate "no client connected"
 * silently. They are safe to call from inside HTTP handlers / use cases
 * without try/catch — we never want a realtime-side failure to break a
 * synchronous business mutation.
 */
@Injectable()
export class RealtimeService {
  constructor(private readonly gateway: RealtimeGateway) {}

  emit_to_user<E extends RealtimeEventName>(
    user_id: number,
    event: E,
    payload?: RealtimeEventPayloads[E],
  ): void {
    this.gateway.server
      ?.to(build_user_room(user_id))
      .emit(event, payload ?? {});
  }

  emit_to_business<E extends RealtimeEventName>(
    business_id: number,
    event: E,
    payload?: RealtimeEventPayloads[E],
  ): void {
    this.gateway.server
      ?.to(build_business_room(business_id))
      .emit(event, payload ?? {});
  }

  emit_to_users<E extends RealtimeEventName>(
    user_ids: number[],
    event: E,
    payload?: RealtimeEventPayloads[E],
  ): void {
    if (user_ids.length === 0) return;
    const rooms = user_ids.map(build_user_room);
    this.gateway.server?.to(rooms).emit(event, payload ?? {});
  }

  /**
   * Convenience wrapper for the most common case today: a user's effective
   * permissions changed (their roles were reassigned, or one of their roles
   * had its permission set updated). The client invalidates the session
   * query on receipt and re-renders with the new permission set.
   */
  notify_permissions_changed(user_id: number, reason?: string): void {
    this.emit_to_user(user_id, REALTIME_EVENTS.PERMISSIONS_CHANGED, {
      reason,
    });
  }

  /**
   * Same, but for every connected user inside a tenant. Use when a single
   * change affects an unknown set of users (e.g. a role's permissions
   * were edited) — the cost is each connected client doing one extra
   * session refetch, which is cheap.
   */
  notify_business_permissions_changed(
    business_id: number,
    reason?: string,
  ): void {
    this.emit_to_business(business_id, REALTIME_EVENTS.PERMISSIONS_CHANGED, {
      reason,
    });
  }

  /**
   * The system-wide permissions catalog changed (a key was added or
   * removed). Broadcast to everyone so the catalog query is invalidated
   * and the dev validation in usePermissions() doesn't false-positive.
   */
  notify_catalog_updated(): void {
    this.gateway.server?.emit(
      REALTIME_EVENTS.PERMISSIONS_CATALOG_UPDATED,
      {},
    );
  }
}
