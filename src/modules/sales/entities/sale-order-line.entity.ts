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
import { ProductVariant } from '../../inventory/entities/product-variant.entity';
import { SaleOrder } from './sale-order.entity';

@Entity('sale_order_lines')
@Index(['business_id', 'sale_order_id', 'line_no'], { unique: true })
export class SaleOrderLine {
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
  sale_order_id!: number;

  @ManyToOne(() => SaleOrder, (order) => order.lines, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'sale_order_id',
  })
  sale_order?: SaleOrder;

  @Column({
    type: 'int',
  })
  line_no!: number;

  @Column({
    type: 'int',
  })
  product_variant_id!: number;

  @ManyToOne(() => ProductVariant, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'product_variant_id',
  })
  product_variant?: ProductVariant;

  @Column({
    type: 'numeric',
    precision: 18,
    scale: 4,
    transformer: numeric_transformer,
  })
  quantity!: number;

  @Column({
    type: 'numeric',
    precision: 18,
    scale: 4,
    transformer: numeric_transformer,
  })
  unit_price!: number;

  @Column({
    type: 'numeric',
    precision: 5,
    scale: 2,
    default: 0,
    transformer: numeric_transformer,
  })
  discount_percent!: number;

  @Column({
    type: 'numeric',
    precision: 18,
    scale: 4,
    default: 0,
    transformer: numeric_transformer,
  })
  tax_amount!: number;

  @Column({
    type: 'numeric',
    precision: 18,
    scale: 4,
    transformer: numeric_transformer,
  })
  line_total!: number;

  @Column({
    type: 'text',
    nullable: true,
  })
  notes!: string | null;

  @CreateDateColumn({
    type: 'timestamptz',
  })
  created_at!: Date;

  @UpdateDateColumn({
    type: 'timestamptz',
  })
  updated_at!: Date;
}
