import { Request } from 'express';

export function get_request_ip(request: Request): string | null {
  const forwarded_for = request.headers['x-forwarded-for'];
  if (typeof forwarded_for === 'string') {
    return forwarded_for.split(',')[0]?.trim() ?? null;
  }

  return request.ip ?? null;
}
