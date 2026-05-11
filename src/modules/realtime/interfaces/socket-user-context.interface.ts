import type { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';

export interface SocketUserContext {
  /** Authenticated principal extracted from the cookie during handshake. */
  user: AuthenticatedUserContext;
  /** Permanent room: every event addressed to this exact user lands here. */
  user_room: string;
  /** Per-tenant room used for tenant-wide broadcasts (catalog updates, etc). */
  business_room: string;
}

export const REALTIME_NAMESPACE = '/realtime';

export function build_user_room(user_id: number): string {
  return `user:${user_id}`;
}

export function build_business_room(business_id: number): string {
  return `business:${business_id}`;
}
