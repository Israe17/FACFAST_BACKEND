import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { numeric_transformer } from '../../common/utils/numeric.transformer';
import { Product } from './product.entity';
import { ProductVariant } from './product-variant.entity';
import { Promotion } from './promotion.entity';

@Entity('promotion_items')
export class PromotionItem {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    type: 'int',
  })
  promotion_id!: number;

  @ManyToOne(() => Promotion, (promotion) => promotion.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'promotion_id',
  })
  promotion?: Promotion;

  @Column({
    type: 'int',
  })
  product_id!: number;

  @ManyToOne(() => Product, (product) => product.promotion_items, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'product_id',
  })
  product?: Product;

  @Column({
    type: 'int',
    nullable: true,
  })
  product_variant_id!: number | null;

  @ManyToOne(() => ProductVariant, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({
    name: 'product_variant_id',
  })
  product_variant?: ProductVariant | null;

  @Column({
    type: 'numeric',
    precision: 14,
    scale: 4,
    nullable: true,
    transformer: numeric_transformer,
  })
  min_quantity!: number | null;

  @Column({
    type: 'numeric',
    precision: 14,
    scale: 4,
    nullable: true,
    transformer: numeric_transformer,
  })
  discount_value!: number | null;

  @Column({
    type: 'numeric',
    precision: 14,
    scale: 4,
    nullable: true,
    transformer: numeric_transformer,
  })
  override_price!: number | null;

  @Column({
    type: 'numeric',
    precision: 14,
    scale: 4,
    nullable: true,
    transformer: numeric_transformer,
  })
  bonus_quantity!: number | null;
}
