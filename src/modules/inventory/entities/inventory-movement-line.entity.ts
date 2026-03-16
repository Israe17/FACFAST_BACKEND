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
import { InventoryMovementHeader } from './inventory-movement-header.entity';
import { ProductVariant } from './product-variant.entity';
import { Warehouse } from './warehouse.entity';

@Entity('inventory_movement_lines')
@Index(['business_id', 'header_id', 'line_no'], { unique: true })
export class InventoryMovementLine {
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
  header_id!: number;

  @ManyToOne(() => InventoryMovementHeader, (header) => header.lines, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'header_id',
  })
  header?: InventoryMovementHeader;

  @Column({
    type: 'int',
  })
  line_no!: number;

  @Column({
    type: 'int',
  })
  product_variant_id!: number;

  @ManyToOne(
    () => ProductVariant,
    (product_variant) => product_variant.inventory_movement_lines,
    {
      onDelete: 'RESTRICT',
    },
  )
  @JoinColumn({
    name: 'product_variant_id',
  })
  product_variant?: ProductVariant;

  @Column({
    type: 'int',
  })
  warehouse_id!: number;

  @ManyToOne(() => Warehouse, (warehouse) => warehouse.inventory_movement_lines, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'warehouse_id',
  })
  warehouse?: Warehouse;

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
    nullable: true,
    transformer: numeric_transformer,
  })
  unit_cost!: number | null;

  @Column({
    type: 'numeric',
    precision: 18,
    scale: 4,
    nullable: true,
    transformer: numeric_transformer,
  })
  total_cost!: number | null;

  @Column({
    type: 'numeric',
    precision: 18,
    scale: 4,
    default: 0,
    transformer: numeric_transformer,
  })
  on_hand_delta!: number;

  @Column({
    type: 'numeric',
    precision: 18,
    scale: 4,
    default: 0,
    transformer: numeric_transformer,
  })
  reserved_delta!: number;

  @Column({
    type: 'numeric',
    precision: 18,
    scale: 4,
    default: 0,
    transformer: numeric_transformer,
  })
  incoming_delta!: number;

  @Column({
    type: 'numeric',
    precision: 18,
    scale: 4,
    default: 0,
    transformer: numeric_transformer,
  })
  outgoing_delta!: number;

  @Column({
    type: 'int',
    nullable: true,
  })
  linked_line_id!: number | null;

  @CreateDateColumn({
    type: 'timestamptz',
  })
  created_at!: Date;

  @UpdateDateColumn({
    type: 'timestamptz',
  })
  updated_at!: Date;
}
