import { Injectable } from '@nestjs/common';
import { QueryUseCase } from '../../common/application/interfaces/query-use-case.interface';
import { DomainNotFoundException } from '../../common/errors/exceptions/domain-not-found.exception';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { TaxProfileView } from '../contracts/tax-profile.view';
import { TaxProfile } from '../entities/tax-profile.entity';
import { TaxProfilesRepository } from '../repositories/tax-profiles.repository';
import { TaxProfileSerializer } from '../serializers/tax-profile.serializer';

export type GetTaxProfileQuery = {
  current_user: AuthenticatedUserContext;
  tax_profile_id: number;
};

@Injectable()
export class GetTaxProfileQueryUseCase
  implements QueryUseCase<GetTaxProfileQuery, TaxProfileView>
{
  constructor(
    private readonly tax_profiles_repository: TaxProfilesRepository,
    private readonly tax_profile_serializer: TaxProfileSerializer,
  ) {}

  async execute({
    current_user,
    tax_profile_id,
  }: GetTaxProfileQuery): Promise<TaxProfileView> {
    const business_id = resolve_effective_business_id(current_user);
    const tax_profile = await this.find_or_throw(business_id, tax_profile_id);
    return this.tax_profile_serializer.serialize(tax_profile);
  }

  private async find_or_throw(
    business_id: number,
    tax_profile_id: number,
  ): Promise<TaxProfile> {
    const tax_profile =
      await this.tax_profiles_repository.find_by_id_in_business(
        tax_profile_id,
        business_id,
      );
    if (!tax_profile) {
      throw new DomainNotFoundException({
        code: 'TAX_PROFILE_NOT_FOUND',
        messageKey: 'inventory.tax_profile_not_found',
        details: { tax_profile_id },
      });
    }
    return tax_profile;
  }
}
