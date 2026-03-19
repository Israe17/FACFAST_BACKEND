import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Branch } from '../../branches/entities/branch.entity';
import { Business } from '../../common/entities/business.entity';
import { numeric_transformer } from '../../common/utils/numeric.transformer';
import { Product } from './product.entity';
import { ProductVariant } from './product-variant.entity';
import { Warehouse } from './warehouse.entity';

@Entity('warehouse_stock')
@Index(['warehouse_id', 'product_id'], { unique: true })
export class WarehouseStock {
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
  branch_id!: number;

  @ManyToOne(() => Branch, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'branch_id',
  })
  branch?: Branch;

  @Column({
    type: 'int',
  })
  warehouse_id!: number;

  @ManyToOne(() => Warehouse, (warehouse) => warehouse.warehouse_stock, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'warehouse_id',
  })
  warehouse?: Warehouse;

  @Column({
    type: 'int',
  })
  product_id!: number;

  @ManyToOne(() => Product, (product) => product.warehouse_stock, {
    onDelete: 'CASCADE',
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
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'product_variant_id',
  })
  product_variant?: ProductVariant | null;

  @Column({
    type: 'numeric',
    precision: 14,
    scale: 4,
    default: 0,
    transformer: numeric_transformer,
  })
  quantity!: number;

  @Column({
    type: 'numeric',
    precision: 14,
    scale: 4,
    default: 0,
    transformer: numeric_transformer,
  })
  reserved_quantity!: number;

  @Column({
    type: 'numeric',
    precision: 14,
    scale: 4,
    nullable: true,
    transformer: numeric_transformer,
  })
  min_stock!: number | null;

  @Column({
    type: 'numeric',
    precision: 14,
    scale: 4,
    nullable: true,
    transformer: numeric_transformer,
  })
  max_stock!: number | null;

  @UpdateDateColumn({
    type: 'timestamptz',
  })
  updated_at!: Date;
}
