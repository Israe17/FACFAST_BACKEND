import {
  DomainExceptionOptions,
  DomainHttpException,
} from './domain-http.exception';

export class DomainUnauthorizedException extends DomainHttpException {
  constructor(options: DomainExceptionOptions) {
    super(401, 'Unauthorized', options);
  }
}
