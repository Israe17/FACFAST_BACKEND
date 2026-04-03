import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Injectable,
} from '@nestjs/common';
import { Response } from 'express';
import { QueryFailedError } from 'typeorm';
import { RequestValidationException } from '../errors/exceptions/request-validation.exception';
import {
  ErrorResponseBody,
  ValidationErrorDetail,
} from '../errors/interfaces/error-response.interface';
import {
  get_generic_error_code,
  get_generic_message_key,
} from '../errors/utils/error-code.util';
import { ErrorI18nService } from '../i18n/error-i18n.service';
import { RequestWithContext } from '../interfaces/request-context.interface';
import { StructuredLoggerService } from '../logging/structured-logger.service';

type ExceptionResponseObject = {
  statusCode?: number;
  error?: string;
  code?: string;
  messageKey?: string;
  message?: string | string[];
  details?: ValidationErrorDetail[] | Record<string, unknown> | null;
  params?: Record<string, string | number | boolean | null | undefined>;
};

type NormalizedException = {
  statusCode: number;
  error: string;
  code: string;
  messageKey: string;
  details?: ValidationErrorDetail[] | Record<string, unknown> | null;
  params?: Record<string, string | number | boolean | null | undefined>;
  isExpected: boolean;
};

@Injectable()
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(
    private readonly error_i18n_service: ErrorI18nService,
    private readonly structured_logger_service: StructuredLoggerService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<RequestWithContext>();
    const normalized_exception = this.normalize_exception(exception);
    const language = this.error_i18n_service.resolve_language(request);
    const timestamp = new Date().toISOString();

    const response_body = this.build_response_body(
      normalized_exception,
      request,
      timestamp,
      language,
    );

    this.log_exception(
      exception,
      normalized_exception,
      response_body,
      request,
      timestamp,
    );

    response.status(normalized_exception.statusCode).json(response_body);
  }

  private build_response_body(
    normalized_exception: NormalizedException,
    request: RequestWithContext,
    timestamp: string,
    language: 'es' | 'en',
  ): ErrorResponseBody {
    return {
      statusCode: normalized_exception.statusCode,
      error: normalized_exception.error,
      code: normalized_exception.code,
      messageKey: normalized_exception.messageKey,
      message: this.error_i18n_service.translate(
        normalized_exception.messageKey,
        language,
        normalized_exception.params,
      ),
      details: this.translate_details(normalized_exception.details, language),
      path: request.originalUrl ?? request.url,
      timestamp,
      requestId: request.request_id,
    };
  }

  private translate_details(
    details:
      | ValidationErrorDetail[]
      | Record<string, unknown>
      | null
      | undefined,
    language: 'es' | 'en',
  ): ValidationErrorDetail[] | Record<string, unknown> | null | undefined {
    if (!Array.isArray(details)) {
      return details;
    }

    return details.map((detail) => ({
      field: detail.field,
      code: detail.code,
      messageKey: detail.messageKey,
      message: this.error_i18n_service.translate(
        detail.messageKey,
        language,
        detail.params,
      ),
    }));
  }

  private normalize_exception(exception: unknown): NormalizedException {
    if (exception instanceof RequestValidationException) {
      const response_body = exception.getResponse() as ExceptionResponseObject;
      return {
        statusCode: exception.getStatus(),
        error: String(response_body.error ?? 'ValidationError'),
        code: String(response_body.code ?? 'VALIDATION_ERROR'),
        messageKey: String(response_body.messageKey ?? 'validation.error'),
        details: response_body.details ?? [],
        params: response_body.params,
        isExpected: true,
      };
    }

    if (this.is_unique_violation(exception)) {
      const constraint_detail = this.extract_unique_violation_detail(exception as QueryFailedError);
      return {
        statusCode: 409,
        error: 'Conflict',
        code: 'UNIQUE_CONSTRAINT_VIOLATION',
        messageKey: 'errors.unique_constraint_violation',
        details: constraint_detail,
        isExpected: true,
      };
    }

    if (exception instanceof HttpException) {
      const status_code = exception.getStatus();
      const response_body = this.normalize_http_exception_body(
        exception.getResponse(),
      );
      const has_domain_metadata = Boolean(
        response_body.code && response_body.messageKey,
      );
      const is_expected = status_code < 500 || has_domain_metadata;

      return {
        statusCode: status_code,
        error: this.normalize_error_name(
          response_body.error,
          status_code,
          exception,
        ),
        code:
          has_domain_metadata && response_body.code
            ? response_body.code
            : status_code < 500
              ? (response_body.code ?? get_generic_error_code(status_code))
              : get_generic_error_code(status_code),
        messageKey:
          has_domain_metadata && response_body.messageKey
            ? response_body.messageKey
            : status_code < 500
              ? (response_body.messageKey ??
                get_generic_message_key(status_code))
              : get_generic_message_key(status_code),
        details: is_expected ? response_body.details : null,
        params: is_expected ? response_body.params : undefined,
        isExpected: is_expected,
      };
    }

    return {
      statusCode: 500,
      error: 'InternalServerError',
      code: 'INTERNAL_SERVER_ERROR',
      messageKey: 'errors.internal_server_error',
      details: null,
      isExpected: false,
    };
  }

  private normalize_http_exception_body(
    value: string | object,
  ): ExceptionResponseObject {
    if (typeof value === 'string') {
      return {
        message: value,
      };
    }

    return value as ExceptionResponseObject;
  }

  private normalize_error_name(
    error: string | undefined,
    status_code: number,
    exception: HttpException,
  ): string {
    if (error) {
      return error;
    }

    if (status_code === 500) {
      return 'InternalServerError';
    }

    return exception.name.replace(/Exception$/, '') || 'HttpError';
  }

  private is_unique_violation(error: unknown): boolean {
    if (!(error instanceof QueryFailedError)) {
      return false;
    }
    const driver_error = error.driverError as { code?: string } | undefined;
    return driver_error?.code === '23505';
  }

  private extract_unique_violation_detail(
    error: QueryFailedError,
  ): Record<string, unknown> {
    const driver_error = error.driverError as {
      detail?: string;
      constraint?: string;
      table?: string;
    } | undefined;
    return {
      constraint: driver_error?.constraint ?? null,
      table: driver_error?.table ?? null,
      detail: driver_error?.detail ?? null,
    };
  }

  private log_exception(
    exception: unknown,
    normalized_exception: NormalizedException,
    response_body: ErrorResponseBody,
    request: RequestWithContext,
    timestamp: string,
  ): void {
    const log_payload = {
      requestId: request.request_id,
      timestamp,
      method: request.method,
      path: request.originalUrl ?? request.url,
      statusCode: normalized_exception.statusCode,
      code: normalized_exception.code,
      messageKey: normalized_exception.messageKey,
      message: response_body.message,
      user_id: request.user?.id ?? null,
      business_id: request.user?.business_id ?? null,
      acting_business_id: request.user?.acting_business_id ?? null,
      acting_branch_id: request.user?.acting_branch_id ?? null,
      details: response_body.details ?? null,
    };

    if (!normalized_exception.isExpected) {
      this.structured_logger_service.log(
        'error',
        'http.unexpected_error',
        log_payload,
        exception instanceof Error ? exception.stack : undefined,
      );
      return;
    }

    if (normalized_exception.code === 'VALIDATION_ERROR') {
      this.structured_logger_service.log(
        'log',
        'http.validation_error',
        log_payload,
      );
      return;
    }

    this.structured_logger_service.log(
      'warn',
      'http.expected_error',
      log_payload,
    );
  }
}
