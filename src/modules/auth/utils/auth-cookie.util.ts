import { CookieOptions } from 'express';

export function build_auth_cookie_options(
  max_age_ms: number,
  same_site: boolean | 'lax' | 'strict' | 'none',
  secure: boolean,
): CookieOptions {
  return {
    httpOnly: true,
    sameSite: same_site,
    secure,
    path: '/',
    maxAge: max_age_ms,
  };
}
