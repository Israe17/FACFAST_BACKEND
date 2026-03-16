import { ErrorMessageDescriptor } from './error-message-descriptor.interface';

export interface ValidationErrorDetail extends ErrorMessageDescriptor {
  field: string;
}

export interface ErrorResponseBody extends ErrorMessageDescriptor {
  statusCode: number;
  error: string;
  details?: ValidationErrorDetail[] | Record<string, unknown> | null;
  path: string;
  timestamp: string;
  requestId?: string;
}
