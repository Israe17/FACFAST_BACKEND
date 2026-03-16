import {
  DomainExceptionOptions,
  DomainHttpException,
} from './domain-http.exception';

export class DomainInternalServerException extends DomainHttpException {
  constructor(options: DomainExceptionOptions) {
    super(500, 'InternalServerError', options);
  }
}
