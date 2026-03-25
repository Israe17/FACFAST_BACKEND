import { Injectable } from '@nestjs/common';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { PlatformContextView } from '../contracts/platform-context.view';
import { EnterBusinessContextDto } from '../dto/enter-business-context.dto';
import { ClearPlatformBusinessContextUseCase } from '../use-cases/clear-platform-business-context.use-case';
import { EnterPlatformBusinessContextUseCase } from '../use-cases/enter-platform-business-context.use-case';

@Injectable()
export class PlatformContextService {
  constructor(
    private readonly enter_platform_business_context_use_case: EnterPlatformBusinessContextUseCase,
    private readonly clear_platform_business_context_use_case: ClearPlatformBusinessContextUseCase,
  ) {}

  async enter_business_context(
    current_user: AuthenticatedUserContext,
    dto: EnterBusinessContextDto,
  ): Promise<PlatformContextView> {
    return this.enter_platform_business_context_use_case.execute({
      current_user,
      dto,
    });
  }

  async clear_business_context(
    current_user: AuthenticatedUserContext,
  ): Promise<PlatformContextView> {
    return this.clear_platform_business_context_use_case.execute({
      current_user,
    });
  }
}
