import type { JwtAccessPayload } from './jwt-access-payload.interface';

export interface JwtRefreshPayload extends JwtAccessPayload {
  session_id: number;
}
