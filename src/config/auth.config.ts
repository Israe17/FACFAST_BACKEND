import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => {
  const cookie_secure = process.env.AUTH_COOKIE_SECURE !== 'false';
  const cookie_same_site = process.env.AUTH_COOKIE_SAME_SITE ?? 'lax';

  // The browser refuses cookies with `SameSite=None` unless they are
  // also `Secure`. Fail at boot rather than silently shipping a config
  // that produces "cookie not sent" symptoms in cross-site deployments.
  if (cookie_same_site === 'none' && !cookie_secure) {
    throw new Error(
      'Invalid auth cookie configuration: AUTH_COOKIE_SAME_SITE=none ' +
        'requires AUTH_COOKIE_SECURE=true (and HTTPS). The browser will ' +
        'reject SameSite=None cookies without the Secure flag.',
    );
  }

  return {
    access_token_secret: process.env.JWT_ACCESS_SECRET!,
    refresh_token_secret: process.env.JWT_REFRESH_SECRET!,
    access_token_expires_in: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    refresh_token_expires_in: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
    access_cookie_name: process.env.ACCESS_COOKIE_NAME ?? 'ff_access_token',
    refresh_cookie_name: process.env.REFRESH_COOKIE_NAME ?? 'ff_refresh_token',
    cookie_secure,
    cookie_same_site,
  };
});
