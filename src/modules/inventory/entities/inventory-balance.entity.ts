import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Business } from '../../common/entities/business.entity';
import { numeric_transformer } from '../../common/utils/numeric.transformer';
import { ProductVariant } from './product-variant.entity';
import { Warehouse } from './warehouse.entity';

@Entity('inventory_balances')
@Index(['business_id', 'warehouse_id', 'product_variant_id'], { unique: true })
export class InventoryBalance {
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
  warehouse_id!: number;

  @ManyToOne(() => Warehouse, (warehouse) => warehouse.inventory_balances, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'warehouse_id',
  })
  warehouse?: Warehouse;

  @Column({
    type: 'int',
  })
  product_variant_id!: number;

  @ManyToOne(
    () => ProductVariant,
    (product_variant) => product_variant.inventory_balances,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({
    name: 'product_variant_id',
  })
  product_variant?: ProductVariant;

  @Column({
    type: 'numeric',
    precision: 18,
    scale: 4,
    default: 0,
    transformer: numeric_transformer,
  })
  on_hand_quantity!: number;

  @Column({
    type: 'numeric',
    precision: 18,
    scale: 4,
    default: 0,
    transformer: numeric_transformer,
  })
  reserved_quantity!: number;

  @Column({
    type: 'numeric',
    precision: 18,
    scale: 4,
    default: 0,
    transformer: numeric_transformer,
  })
  incoming_quantity!: number;

  @Column({
    type: 'numeric',
    precision: 18,
    scale: 4,
    default: 0,
    transformer: numeric_transformer,
  })
  outgoing_quantity!: number;

  @UpdateDateColumn({
    type: 'timestamptz',
  })
  updated_at!: Date;
}
