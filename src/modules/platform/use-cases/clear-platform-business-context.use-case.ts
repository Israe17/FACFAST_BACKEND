import { Injectable } from '@nestjs/common';
import { CommandUseCase } from '../../common/application/interfaces/command-use-case.interface';
import { RefreshTokensRepository } from '../../auth/repositories/refresh-tokens.repository';
import { DomainUnauthorizedException } from '../../common/errors/exceptions/domain-unauthorized.exception';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { UsersService } from '../../users/services/users.service';
import { PlatformContextView } from '../contracts/platform-context.view';
import { PlatformContextSerializer } from '../serializers/platform-context.serializer';
import { PlatformValidationService } from '../services/platform-validation.service';

export type ClearPlatformBusinessContextCommand = {
  current_user: AuthenticatedUserContext;
};

@Injectable()
export class ClearPlatformBusinessContextUseCase
  implements
    CommandUseCase<ClearPlatformBusinessContextCommand, PlatformContextView>
{
  constructor(
    private readonly refresh_tokens_repository: RefreshTokensRepository,
    private readonly users_service: UsersService,
    private readonly platform_validation_service: PlatformValidationService,
    private readonly platform_context_serializer: PlatformContextSerializer,
  ) {}

  async execute({
    current_user,
  }: ClearPlatformBusinessContextCommand): Promise<PlatformContextView> {
    const session_id =
      this.platform_validation_service.assert_session_id(current_user);

    await this.refresh_tokens_repository.update_acting_context(
      session_id,
      null,
      null,
    );

    const context = await this.users_service.get_authenticated_context(
      current_user.id,
      current_user.business_id,
      true,
      {
        session_id,
        acting_business_id: null,
        acting_branch_id: null,
      },
    );
    if (!context) {
      throw new DomainUnauthorizedException({
        code: 'PLATFORM_CONTEXT_RESOLUTION_FAILED',
        messageKey: 'platform.context_resolution_failed',
      });
    }

    return this.platform_context_serializer.serialize(context);
  }
}
