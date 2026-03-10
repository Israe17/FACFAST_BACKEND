import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EntityCodeService } from '../../common/services/entity-code.service';
import { PromotionItem } from '../entities/promotion-item.entity';
import { Promotion } from '../entities/promotion.entity';

const promotion_relations = {
  items: {
    product: true,
  },
} as const;

@Injectable()
export class PromotionsRepository {
  constructor(
    @InjectRepository(Promotion)
    private readonly promotion_repository: Repository<Promotion>,
    @InjectRepository(PromotionItem)
    private readonly promotion_item_repository: Repository<PromotionItem>,
    private readonly entity_code_service: EntityCodeService,
  ) {}

  create(payload: Partial<Promotion>): Promotion {
    return this.promotion_repository.create(payload);
  }

  async save(promotion: Promotion): Promise<Promotion> {
    const saved_promotion = await this.promotion_repository.save(promotion);
    return this.entity_code_service.ensure_code(
      this.promotion_repository,
      saved_promotion,
      'PN',
    );
  }

  async replace_items(
    promotion_id: number,
    items: Partial<PromotionItem>[],
  ): Promise<void> {
    await this.promotion_item_repository.delete({ promotion_id });
    if (!items.length) {
      return;
    }

    await this.promotion_item_repository.save(
      items.map((item) => this.promotion_item_repository.create(item)),
    );
  }

  async find_all_by_business(business_id: number): Promise<Promotion[]> {
    return this.promotion_repository.find({
      where: { business_id },
      relations: promotion_relations,
      order: {
        valid_from: 'DESC',
        name: 'ASC',
      },
    });
  }

  async find_by_id_in_business(
    id: number,
    business_id: number,
  ): Promise<Promotion | null> {
    return this.promotion_repository.findOne({
      where: { id, business_id },
      relations: promotion_relations,
    });
  }

  async exists_name_in_business(
    business_id: number,
    name: string,
    exclude_id?: number,
  ): Promise<boolean> {
    const query = this.promotion_repository
      .createQueryBuilder('promotion')
      .where('promotion.business_id = :business_id', { business_id })
      .andWhere('LOWER(promotion.name) = LOWER(:name)', { name });

    if (exclude_id !== undefined) {
      query.andWhere('promotion.id != :exclude_id', { exclude_id });
    }

    return (await query.getCount()) > 0;
  }
}
