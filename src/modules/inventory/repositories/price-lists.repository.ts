import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EntityCodeService } from '../../common/services/entity-code.service';
import { PriceList } from '../entities/price-list.entity';

@Injectable()
export class PriceListsRepository {
  constructor(
    @InjectRepository(PriceList)
    private readonly price_list_repository: Repository<PriceList>,
    private readonly entity_code_service: EntityCodeService,
  ) {}

  create(payload: Partial<PriceList>): PriceList {
    return this.price_list_repository.create(payload);
  }

  async save(price_list: PriceList): Promise<PriceList> {
    const saved_price_list = await this.price_list_repository.save(price_list);
    return this.entity_code_service.ensure_code(
      this.price_list_repository,
      saved_price_list,
      'PL',
    );
  }

  async unset_default_for_business(
    business_id: number,
    exclude_id?: number,
  ): Promise<void> {
    const query = this.price_list_repository
      .createQueryBuilder()
      .update(PriceList)
      .set({ is_default: false })
      .where('business_id = :business_id', { business_id });

    if (exclude_id !== undefined) {
      query.andWhere('id != :exclude_id', { exclude_id });
    }

    await query.execute();
  }

  async find_all_by_business(business_id: number): Promise<PriceList[]> {
    return this.price_list_repository.find({
      where: { business_id },
      order: {
        is_default: 'DESC',
        name: 'ASC',
      },
    });
  }

  async find_by_id_in_business(
    id: number,
    business_id: number,
  ): Promise<PriceList | null> {
    return this.price_list_repository.findOne({
      where: { id, business_id },
    });
  }

  async remove(price_list: PriceList): Promise<void> {
    await this.price_list_repository.remove(price_list);
  }

  async exists_name_in_business(
    business_id: number,
    name: string,
    exclude_id?: number,
  ): Promise<boolean> {
    const query = this.price_list_repository
      .createQueryBuilder('price_list')
      .where('price_list.business_id = :business_id', { business_id })
      .andWhere('LOWER(price_list.name) = LOWER(:name)', { name });

    if (exclude_id !== undefined) {
      query.andWhere('price_list.id != :exclude_id', { exclude_id });
    }

    return (await query.getCount()) > 0;
  }
}
