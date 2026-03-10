import { Request } from 'express';

export function extract_cookie_token(
  request: Request,
  cookie_name: string,
): string | null {
  if (!request?.cookies) {
    return null;
  }

  const cookies = request.cookies as Record<string, unknown>;
  const value = cookies[cookie_name];
  return typeof value === 'string' ? value : null;
}
