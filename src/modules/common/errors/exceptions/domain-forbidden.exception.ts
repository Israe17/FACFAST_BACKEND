import {
  DomainExceptionOptions,
  DomainHttpException,
} from './domain-http.exception';

export class DomainForbiddenException extends DomainHttpException {
  constructor(options: DomainExceptionOptions) {
    super(403, 'Forbidden', options);
  }
}
