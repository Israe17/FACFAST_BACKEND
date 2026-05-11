/**
 * Catalog of realtime event names exchanged over the /realtime namespace.
 * Frontend mirrors these strings in shared/realtime/realtime-events.ts —
 * keep both in sync (or codegen one from the other in a future iteration).
 *
 * All events are server → client. The gateway does not dispatch on
 * client-emitted events today; if that changes, document the contract
 * here too.
 */
export const REALTIME_EVENTS = {
  /**
   * The receiving user's roles or per-role permissions changed. Clients
   * should invalidate their session query so `user.permissions` reflects
   * the new set on the next render.
   */
  PERMISSIONS_CHANGED: 'permissions.changed',

  /**
   * The system-wide permissions catalog (the list of permission keys that
   * exist) was updated — typically because a backend deploy seeded new
   * keys or removed obsolete ones. Clients should invalidate the catalog
   * query.
   */
  PERMISSIONS_CATALOG_UPDATED: 'permissions.catalog_updated',

  /**
   * The receiving user's session was invalidated server-side (admin
   * action, password change elsewhere, role reassignment that requires
   * re-auth). Clients should bounce to /login.
   */
  SESSION_INVALIDATED: 'session.invalidated',
} as const;

export type RealtimeEventName =
  (typeof REALTIME_EVENTS)[keyof typeof REALTIME_EVENTS];

/**
 * Minimal payloads. Most events carry no data — the receiver knows the
 * context (it's their own user, the room they're in). Add fields when a
 * specific consumer needs more than "go invalidate this query".
 */
export type RealtimeEventPayloads = {
  [REALTIME_EVENTS.PERMISSIONS_CHANGED]: { reason?: string };
  [REALTIME_EVENTS.PERMISSIONS_CATALOG_UPDATED]: Record<string, never>;
  [REALTIME_EVENTS.SESSION_INVALIDATED]: { reason?: string };
};
