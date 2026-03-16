import { BadRequestException } from '@nestjs/common';
import { ValidationErrorDetail } from '../interfaces/error-response.interface';

export class RequestValidationException extends BadRequestException {
  constructor(details: ValidationErrorDetail[]) {
    super({
      statusCode: 400,
      error: 'ValidationError',
      code: 'VALIDATION_ERROR',
      messageKey: 'validation.error',
      details,
    });
  }
}
