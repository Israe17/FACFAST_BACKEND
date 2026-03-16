import { Injectable, Logger } from '@nestjs/common';

type LogLevel = 'log' | 'warn' | 'error';

@Injectable()
export class StructuredLoggerService {
  private readonly logger = new Logger('HttpErrorHandling');

  log(
    level: LogLevel,
    event: string,
    payload: Record<string, unknown>,
    stack?: string,
  ): void {
    const serialized_payload = JSON.stringify({
      event,
      ...payload,
    });

    if (level === 'error') {
      this.logger.error(serialized_payload, stack);
      return;
    }

    if (level === 'warn') {
      this.logger.warn(serialized_payload);
      return;
    }

    this.logger.log(serialized_payload);
  }
}
