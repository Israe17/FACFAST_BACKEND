import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: Number(process.env.PORT ?? 3000),
  cors_origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
}));
