import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const IdempotencyKey = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string | null => {
    const request = context.switchToHttp().getRequest<{
      headers?: Record<string, string | string[] | undefined>;
    }>();
    const raw_value = request.headers?.['idempotency-key'];
    if (Array.isArray(raw_value)) {
      return raw_value[0]?.trim() || null;
    }

    return raw_value?.trim() || null;
  },
);
