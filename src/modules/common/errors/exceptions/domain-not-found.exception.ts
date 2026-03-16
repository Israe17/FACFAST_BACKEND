import {
  DomainExceptionOptions,
  DomainHttpException,
} from './domain-http.exception';

export class DomainNotFoundException extends DomainHttpException {
  constructor(options: DomainExceptionOptions) {
    super(404, 'NotFound', options);
  }
}
