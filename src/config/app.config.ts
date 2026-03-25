import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: Number(process.env.PORT ?? 3000),
  cors_origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  outbox_workers_enabled: process.env.OUTBOX_WORKERS_ENABLED !== 'false',
  outbox_poll_interval_ms: Number(
    process.env.OUTBOX_POLL_INTERVAL_MS ?? 5000,
  ),
  outbox_batch_size: Number(process.env.OUTBOX_BATCH_SIZE ?? 10),
}));
