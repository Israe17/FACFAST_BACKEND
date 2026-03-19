import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EntityCodeService } from '../../common/services/entity-code.service';
import { WarrantyProfile } from '../entities/warranty-profile.entity';

@Injectable()
export class WarrantyProfilesRepository {
  constructor(
    @InjectRepository(WarrantyProfile)
    private readonly warranty_profile_repository: Repository<WarrantyProfile>,
    private readonly entity_code_service: EntityCodeService,
  ) {}

  create(payload: Partial<WarrantyProfile>): WarrantyProfile {
    return this.warranty_profile_repository.create(payload);
  }

  async save(warranty_profile: WarrantyProfile): Promise<WarrantyProfile> {
    const saved_warranty_profile =
      await this.warranty_profile_repository.save(warranty_profile);
    return this.entity_code_service.ensure_code(
      this.warranty_profile_repository,
      saved_warranty_profile,
      'WP',
    );
  }

  async find_all_by_business(business_id: number): Promise<WarrantyProfile[]> {
    return this.warranty_profile_repository.find({
      where: { business_id },
      order: { name: 'ASC' },
    });
  }

  async find_by_id_in_business(
    id: number,
    business_id: number,
  ): Promise<WarrantyProfile | null> {
    return this.warranty_profile_repository.findOne({
      where: { id, business_id },
    });
  }

  async remove(warranty_profile: WarrantyProfile): Promise<void> {
    await this.warranty_profile_repository.remove(warranty_profile);
  }

  async exists_name_in_business(
    business_id: number,
    name: string,
    exclude_id?: number,
  ): Promise<boolean> {
    const query = this.warranty_profile_repository
      .createQueryBuilder('warranty_profile')
      .where('warranty_profile.business_id = :business_id', { business_id })
      .andWhere('LOWER(warranty_profile.name) = LOWER(:name)', { name });

    if (exclude_id !== undefined) {
      query.andWhere('warranty_profile.id != :exclude_id', { exclude_id });
    }

    return (await query.getCount()) > 0;
  }
}
