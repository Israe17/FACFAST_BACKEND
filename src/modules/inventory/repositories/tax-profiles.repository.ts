import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EntityCodeService } from '../../common/services/entity-code.service';
import { TaxProfile } from '../entities/tax-profile.entity';

@Injectable()
export class TaxProfilesRepository {
  constructor(
    @InjectRepository(TaxProfile)
    private readonly tax_profile_repository: Repository<TaxProfile>,
    private readonly entity_code_service: EntityCodeService,
  ) {}

  create(payload: Partial<TaxProfile>): TaxProfile {
    return this.tax_profile_repository.create(payload);
  }

  async save(tax_profile: TaxProfile): Promise<TaxProfile> {
    const saved_tax_profile =
      await this.tax_profile_repository.save(tax_profile);
    return this.entity_code_service.ensure_code(
      this.tax_profile_repository,
      saved_tax_profile,
      'TF',
    );
  }

  async find_all_by_business(business_id: number): Promise<TaxProfile[]> {
    return this.tax_profile_repository.find({
      where: { business_id },
      order: { name: 'ASC' },
    });
  }

  async find_by_id_in_business(
    id: number,
    business_id: number,
  ): Promise<TaxProfile | null> {
    return this.tax_profile_repository.findOne({
      where: { id, business_id },
    });
  }

  async exists_name_in_business(
    business_id: number,
    name: string,
    exclude_id?: number,
  ): Promise<boolean> {
    const query = this.tax_profile_repository
      .createQueryBuilder('tax_profile')
      .where('tax_profile.business_id = :business_id', { business_id })
      .andWhere('LOWER(tax_profile.name) = LOWER(:name)', { name });

    if (exclude_id !== undefined) {
      query.andWhere('tax_profile.id != :exclude_id', { exclude_id });
    }

    return (await query.getCount()) > 0;
  }
}
