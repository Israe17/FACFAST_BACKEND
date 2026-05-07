import { Injectable } from '@nestjs/common';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { CreateTaxProfileDto } from '../dto/create-tax-profile.dto';
import { UpdateTaxProfileDto } from '../dto/update-tax-profile.dto';
import { CreateTaxProfileUseCase } from '../use-cases/create-tax-profile.use-case';
import { GetTaxProfileQueryUseCase } from '../use-cases/get-tax-profile.query.use-case';
import { GetTaxProfilesQueryUseCase } from '../use-cases/get-tax-profiles.query.use-case';
import { UpdateTaxProfileUseCase } from '../use-cases/update-tax-profile.use-case';

@Injectable()
export class TaxProfilesService {
  constructor(
    private readonly get_tax_profiles_query_use_case: GetTaxProfilesQueryUseCase,
    private readonly get_tax_profile_query_use_case: GetTaxProfileQueryUseCase,
    private readonly create_tax_profile_use_case: CreateTaxProfileUseCase,
    private readonly update_tax_profile_use_case: UpdateTaxProfileUseCase,
  ) {}

  get_tax_profiles(current_user: AuthenticatedUserContext) {
    return this.get_tax_profiles_query_use_case.execute({ current_user });
  }

  get_tax_profile(
    current_user: AuthenticatedUserContext,
    tax_profile_id: number,
  ) {
    return this.get_tax_profile_query_use_case.execute({
      current_user,
      tax_profile_id,
    });
  }

  create_tax_profile(
    current_user: AuthenticatedUserContext,
    dto: CreateTaxProfileDto,
  ) {
    return this.create_tax_profile_use_case.execute({ current_user, dto });
  }

  update_tax_profile(
    current_user: AuthenticatedUserContext,
    tax_profile_id: number,
    dto: UpdateTaxProfileDto,
  ) {
    return this.update_tax_profile_use_case.execute({
      current_user,
      tax_profile_id,
      dto,
    });
  }
}
