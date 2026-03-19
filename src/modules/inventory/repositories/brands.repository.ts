import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EntityCodeService } from '../../common/services/entity-code.service';
import { Brand } from '../entities/brand.entity';

@Injectable()
export class BrandsRepository {
  constructor(
    @InjectRepository(Brand)
    private readonly brand_repository: Repository<Brand>,
    private readonly entity_code_service: EntityCodeService,
  ) {}

  create(payload: Partial<Brand>): Brand {
    return this.brand_repository.create(payload);
  }

  async save(brand: Brand): Promise<Brand> {
    const saved_brand = await this.brand_repository.save(brand);
    return this.entity_code_service.ensure_code(
      this.brand_repository,
      saved_brand,
      'MK',
    );
  }

  async find_all_by_business(business_id: number): Promise<Brand[]> {
    return this.brand_repository.find({
      where: { business_id },
      order: { name: 'ASC' },
    });
  }

  async find_by_id_in_business(
    id: number,
    business_id: number,
  ): Promise<Brand | null> {
    return this.brand_repository.findOne({
      where: { id, business_id },
    });
  }

  async remove(brand: Brand): Promise<void> {
    await this.brand_repository.remove(brand);
  }

  async exists_name_in_business(
    business_id: number,
    name: string,
    exclude_id?: number,
  ): Promise<boolean> {
    const query = this.brand_repository
      .createQueryBuilder('brand')
      .where('brand.business_id = :business_id', { business_id })
      .andWhere('LOWER(brand.name) = LOWER(:name)', { name });

    if (exclude_id !== undefined) {
      query.andWhere('brand.id != :exclude_id', { exclude_id });
    }

    return (await query.getCount()) > 0;
  }
}
