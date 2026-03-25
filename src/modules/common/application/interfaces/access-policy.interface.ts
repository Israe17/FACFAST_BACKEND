import { AuthenticatedUserContext } from '../../interfaces/authenticated-user-context.interface';

export interface AccessPolicy<TSubject> {
  assert_can_access(
    current_user: AuthenticatedUserContext,
    subject: TSubject,
  ): void;
}
