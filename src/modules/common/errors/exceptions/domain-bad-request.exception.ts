import {
  DomainExceptionOptions,
  DomainHttpException,
} from './domain-http.exception';

export class DomainBadRequestException extends DomainHttpException {
  constructor(options: DomainExceptionOptions) {
    super(400, 'BadRequest', options);
  }
}
