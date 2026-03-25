import { Injectable } from '@nestjs/common';
import { CommandUseCase } from '../../common/application/interfaces/command-use-case.interface';
import { RefreshTokensRepository } from '../../auth/repositories/refresh-tokens.repository';
import { DomainUnauthorizedException } from '../../common/errors/exceptions/domain-unauthorized.exception';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { UsersService } from '../../users/services/users.service';
import { PlatformContextView } from '../contracts/platform-context.view';
import { EnterBusinessContextDto } from '../dto/enter-business-context.dto';
import { PlatformContextSerializer } from '../serializers/platform-context.serializer';
import { PlatformValidationService } from '../services/platform-validation.service';

export type EnterPlatformBusinessContextCommand = {
  current_user: AuthenticatedUserContext;
  dto: EnterBusinessContextDto;
};

@Injectable()
export class EnterPlatformBusinessContextUseCase
  implements
    CommandUseCase<EnterPlatformBusinessContextCommand, PlatformContextView>
{
  constructor(
    private readonly refresh_tokens_repository: RefreshTokensRepository,
    private readonly users_service: UsersService,
    private readonly platform_validation_service: PlatformValidationService,
    private readonly platform_context_serializer: PlatformContextSerializer,
  ) {}

  async execute({
    current_user,
    dto,
  }: EnterPlatformBusinessContextCommand): Promise<PlatformContextView> {
    const session_id =
      this.platform_validation_service.assert_session_id(current_user);
    const business =
      await this.platform_validation_service.get_active_business_or_fail(
        dto.business_id,
      );

    let acting_branch_id: number | null = null;
    if (dto.branch_id !== undefined) {
      acting_branch_id = (
        await this.platform_validation_service.get_branch_in_business_or_fail(
          business.id,
          dto.branch_id,
        )
      ).id;
    }

    await this.refresh_tokens_repository.update_acting_context(
      session_id,
      business.id,
      acting_branch_id,
    );

    const context = await this.users_service.get_authenticated_context(
      current_user.id,
      current_user.business_id,
      true,
      {
        session_id,
        acting_business_id: business.id,
        acting_branch_id,
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
