import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';

export interface RefreshSessionUser extends AuthenticatedUserContext {
  session_id: number;
}
