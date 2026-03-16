import { Injectable } from '@nestjs/common';
import { BranchesRepository } from '../../branches/repositories/branches.repository';
import { BusinessesRepository } from '../../businesses/repositories/businesses.repository';
import { UsersService } from '../../users/services/users.service';
import { AuthenticatedUserMode } from '../../common/enums/authenticated-user-mode.enum';
import { DomainBadRequestException } from '../../common/errors/exceptions/domain-bad-request.exception';
import { DomainNotFoundException } from '../../common/errors/exceptions/domain-not-found.exception';
import { DomainUnauthorizedException } from '../../common/errors/exceptions/domain-unauthorized.exception';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { RefreshTokensRepository } from '../../auth/repositories/refresh-tokens.repository';
import { EnterBusinessContextDto } from '../dto/enter-business-context.dto';

@Injectable()
export class PlatformContextService {
  constructor(
    private readonly refresh_tokens_repository: RefreshTokensRepository,
    private readonly businesses_repository: BusinessesRepository,
    private readonly branches_repository: BranchesRepository,
    private readonly users_service: UsersService,
  ) {}

  async enter_business_context(
    current_user: AuthenticatedUserContext,
    dto: EnterBusinessContextDto,
  ) {
    const session_id = this.assert_session_id(current_user);
    const business = await this.businesses_repository.find_by_id(
      dto.business_id,
    );
    if (!business) {
      throw new DomainNotFoundException({
        code: 'PLATFORM_BUSINESS_NOT_FOUND',
        messageKey: 'platform.business_not_found',
        details: {
          business_id: dto.business_id,
        },
      });
    }
    if (!business.is_active) {
      throw new DomainBadRequestException({
        code: 'PLATFORM_BUSINESS_INACTIVE',
        messageKey: 'platform.business_inactive',
        details: {
          business_id: dto.business_id,
        },
      });
    }

    let acting_branch_id: number | null = null;
    if (dto.branch_id !== undefined) {
      const branch = await this.branches_repository.find_by_id_in_business(
        dto.branch_id,
        business.id,
      );
      if (!branch) {
        throw new DomainBadRequestException({
          code: 'PLATFORM_BRANCH_CONTEXT_INVALID',
          messageKey: 'platform.branch_context_invalid',
          details: {
            business_id: business.id,
            branch_id: dto.branch_id,
          },
        });
      }
      if (!branch.is_active) {
        throw new DomainBadRequestException({
          code: 'PLATFORM_BRANCH_INACTIVE',
          messageKey: 'platform.branch_inactive',
          details: {
            branch_id: dto.branch_id,
          },
        });
      }
      acting_branch_id = branch.id;
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

    return this.serialize_context_response(context);
  }

  async clear_business_context(current_user: AuthenticatedUserContext) {
    const session_id = this.assert_session_id(current_user);

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

    return this.serialize_context_response(context);
  }

  private assert_session_id(current_user: AuthenticatedUserContext): number {
    if (!current_user.session_id) {
      throw new DomainUnauthorizedException({
        code: 'PLATFORM_SESSION_CONTEXT_UNAVAILABLE',
        messageKey: 'platform.session_context_unavailable',
      });
    }

    return current_user.session_id;
  }

  private serialize_context_response(current_user: AuthenticatedUserContext) {
    return {
      success: true,
      mode: current_user.mode,
      business_id: current_user.business_id,
      acting_business_id: current_user.acting_business_id,
      acting_branch_id: current_user.acting_branch_id,
      is_platform_admin: current_user.is_platform_admin,
      platform_ready:
        current_user.mode === AuthenticatedUserMode.PLATFORM ||
        current_user.mode === AuthenticatedUserMode.TENANT_CONTEXT,
      tenant_context_active:
        current_user.mode === AuthenticatedUserMode.TENANT_CONTEXT,
    };
  }
}
