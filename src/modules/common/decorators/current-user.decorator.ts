import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedUserContext } from '../interfaces/authenticated-user-context.interface';

export const CurrentUser = createParamDecorator(
  (
    property: keyof AuthenticatedUserContext | undefined,
    context: ExecutionContext,
  ) => {
    const request = context
      .switchToHttp()
      .getRequest<{ user?: AuthenticatedUserContext }>();
    const user = request.user;

    if (!user || !property) {
      return user;
    }

    return user[property];
  },
);
