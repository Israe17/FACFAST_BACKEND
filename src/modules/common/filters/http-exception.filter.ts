import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const exception_response =
      exception instanceof HttpException ? exception.getResponse() : null;

    response.status(status).json({
      status_code: status,
      message: this.resolve_message(exception_response, exception),
      error: this.resolve_error(exception_response, exception),
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private resolve_message(
    exception_response: string | object | null,
    exception: unknown,
  ): string | string[] {
    if (typeof exception_response === 'string') {
      return exception_response;
    }

    if (
      exception_response &&
      typeof exception_response === 'object' &&
      'message' in exception_response
    ) {
      return exception_response.message as string | string[];
    }

    if (exception instanceof Error) {
      return exception.message;
    }

    return 'Internal server error';
  }

  private resolve_error(
    exception_response: string | object | null,
    exception: unknown,
  ): string {
    if (
      exception_response &&
      typeof exception_response === 'object' &&
      'error' in exception_response
    ) {
      return String(exception_response.error);
    }

    if (exception instanceof HttpException) {
      return exception.name;
    }

    if (exception instanceof Error) {
      return exception.name;
    }

    return 'Error';
  }
}
