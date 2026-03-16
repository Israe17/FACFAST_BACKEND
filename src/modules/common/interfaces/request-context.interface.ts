import { Request } from 'express';
import { AuthenticatedUserContext } from './authenticated-user-context.interface';

export interface RequestWithContext extends Request {
  user?: AuthenticatedUserContext;
  request_id?: string;
}
