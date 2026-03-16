import { DomainInternalServerException } from '../errors/exceptions/domain-internal-server.exception';
import { ErrorI18nService } from '../i18n/error-i18n.service';
import { StructuredLoggerService } from '../logging/structured-logger.service';
import { HttpExceptionFilter } from './http-exception.filter';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;

  beforeEach(() => {
    filter = new HttpExceptionFilter(
      {
        resolve_language: jest.fn().mockReturnValue('es'),
        translate: jest.fn((message_key: string) => message_key),
      } as unknown as ErrorI18nService,
      {
        log: jest.fn(),
      } as unknown as StructuredLoggerService,
    );
  });

  it('preserves code and messageKey for modeled internal domain exceptions', () => {
    const normalized = (
      filter as unknown as {
        normalize_exception: (exception: unknown) => Record<string, unknown>;
      }
    ).normalize_exception(
      new DomainInternalServerException({
        code: 'FIELD_ENCRYPTION_KEY_MISSING',
        messageKey: 'common.field_encryption_key_missing',
      }),
    );

    expect(normalized).toMatchObject({
      statusCode: 500,
      error: 'InternalServerError',
      code: 'FIELD_ENCRYPTION_KEY_MISSING',
      messageKey: 'common.field_encryption_key_missing',
      isExpected: true,
    });
  });

  it('keeps unexpected internal errors generic', () => {
    const normalized = (
      filter as unknown as {
        normalize_exception: (exception: unknown) => Record<string, unknown>;
      }
    ).normalize_exception(new Error('unexpected failure'));

    expect(normalized).toMatchObject({
      statusCode: 500,
      error: 'InternalServerError',
      code: 'INTERNAL_SERVER_ERROR',
      messageKey: 'errors.internal_server_error',
      isExpected: false,
    });
  });
});
