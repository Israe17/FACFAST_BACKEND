import { Injectable } from '@nestjs/common';
import { QueryUseCase } from '../../common/application/interfaces/query-use-case.interface';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { TaxProfileView } from '../contracts/tax-profile.view';
import { TaxProfilesRepository } from '../repositories/tax-profiles.repository';
import { TaxProfileSerializer } from '../serializers/tax-profile.serializer';

export type GetTaxProfilesQuery = {
  current_user: AuthenticatedUserContext;
};

@Injectable()
export class GetTaxProfilesQueryUseCase
  implements QueryUseCase<GetTaxProfilesQuery, TaxProfileView[]>
{
  constructor(
    private readonly tax_profiles_repository: TaxProfilesRepository,
    private readonly tax_profile_serializer: TaxProfileSerializer,
  ) {}

  async execute({
    current_user,
  }: GetTaxProfilesQuery): Promise<TaxProfileView[]> {
    const business_id = resolve_effective_business_id(current_user);
    const tax_profiles =
      await this.tax_profiles_repository.find_all_by_business(business_id);
    return tax_profiles.map((tax_profile) =>
      this.tax_profile_serializer.serialize(tax_profile),
    );
  }
}
