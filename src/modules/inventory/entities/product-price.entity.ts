import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Business } from '../../common/entities/business.entity';
import { numeric_transformer } from '../../common/utils/numeric.transformer';
import { PriceList } from './price-list.entity';
import { Product } from './product.entity';

@Entity('product_prices')
@Index(['product_id', 'price_list_id', 'min_quantity'], { unique: true })
export class ProductPrice {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    type: 'int',
  })
  business_id!: number;

  @ManyToOne(() => Business, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'business_id',
  })
  business?: Business;

  @Column({
    type: 'int',
  })
  product_id!: number;

  @ManyToOne(() => Product, (product) => product.product_prices, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'product_id',
  })
  product?: Product;

  @Column({
    type: 'int',
  })
  price_list_id!: number;

  @ManyToOne(() => PriceList, (price_list) => price_list.product_prices, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'price_list_id',
  })
  price_list?: PriceList;

  @Column({
    type: 'numeric',
    precision: 14,
    scale: 4,
    transformer: numeric_transformer,
  })
  price!: number;

  @Column({
    type: 'numeric',
    precision: 14,
    scale: 4,
    nullable: true,
    transformer: numeric_transformer,
  })
  min_quantity!: number | null;

  @Column({
    type: 'timestamptz',
    nullable: true,
  })
  valid_from!: Date | null;

  @Column({
    type: 'timestamptz',
    nullable: true,
  })
  valid_to!: Date | null;

  @Column({
    type: 'boolean',
    default: true,
  })
  is_active!: boolean;

  @CreateDateColumn({
    type: 'timestamptz',
  })
  created_at!: Date;

  @UpdateDateColumn({
    type: 'timestamptz',
  })
  updated_at!: Date;
}
