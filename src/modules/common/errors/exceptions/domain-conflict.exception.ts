import {
  DomainExceptionOptions,
  DomainHttpException,
} from './domain-http.exception';

export class DomainConflictException extends DomainHttpException {
  constructor(options: DomainExceptionOptions) {
    super(409, 'Conflict', options);
  }
}
