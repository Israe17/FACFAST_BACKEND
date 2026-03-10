import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => ({
  access_token_secret:
    process.env.JWT_ACCESS_SECRET ?? 'change-me-access-secret',
  refresh_token_secret:
    process.env.JWT_REFRESH_SECRET ?? 'change-me-refresh-secret',
  access_token_expires_in: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
  refresh_token_expires_in: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  access_cookie_name: process.env.ACCESS_COOKIE_NAME ?? 'ff_access_token',
  refresh_cookie_name: process.env.REFRESH_COOKIE_NAME ?? 'ff_refresh_token',
  cookie_secure: process.env.AUTH_COOKIE_SECURE !== 'false',
  cookie_same_site: process.env.AUTH_COOKIE_SAME_SITE ?? 'none',
}));
