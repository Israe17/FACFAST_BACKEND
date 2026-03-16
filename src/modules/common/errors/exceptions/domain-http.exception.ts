import { HttpException } from '@nestjs/common';

export interface DomainExceptionOptions {
  code: string;
  messageKey: string;
  details?: Record<string, unknown> | null;
  params?: Record<string, string | number | boolean | null | undefined>;
}

export class DomainHttpException extends HttpException {
  constructor(
    status_code: number,
    error: string,
    options: DomainExceptionOptions,
  ) {
    super(
      {
        statusCode: status_code,
        error,
        code: options.code,
        messageKey: options.messageKey,
        details: options.details ?? null,
        params: options.params,
      },
      status_code,
    );
  }
}
