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
import { Branch } from '../../branches/entities/branch.entity';
import { Business } from '../../common/entities/business.entity';
import { numeric_transformer } from '../../common/utils/numeric.transformer';
import { User } from '../../users/entities/user.entity';
import { SaleOrder } from '../../sales/entities/sale-order.entity';
import { SaleOrderLine } from '../../sales/entities/sale-order-line.entity';
import { ProductVariant } from './product-variant.entity';
import { Warehouse } from './warehouse.entity';
import { InventoryReservationStatus } from '../enums/inventory-reservation-status.enum';

@Entity('inventory_reservations')
@Index(['business_id', 'sale_order_id'])
@Index(['business_id', 'warehouse_id', 'product_variant_id', 'status'])
@Index(['business_id', 'sale_order_line_id', 'warehouse_id'], { unique: true })
export class InventoryReservation {
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
  sale_order_id!: number;

  @ManyToOne(() => SaleOrder, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'sale_order_id',
  })
  sale_order?: SaleOrder;

  @Column({
    type: 'int',
  })
  sale_order_line_id!: number;

  @ManyToOne(() => SaleOrderLine, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'sale_order_line_id',
  })
  sale_order_line?: SaleOrderLine;

  @Column({
    type: 'int',
  })
  warehouse_id!: number;

  @ManyToOne(() => Warehouse, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'warehouse_id',
  })
  warehouse?: Warehouse;

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
  reserved_quantity!: number;

  @Column({
    type: 'numeric',
    precision: 18,
    scale: 4,
    default: 0,
    transformer: numeric_transformer,
  })
  consumed_quantity!: number;

  @Column({
    type: 'numeric',
    precision: 18,
    scale: 4,
    default: 0,
    transformer: numeric_transformer,
  })
  released_quantity!: number;

  @Column({
    type: 'varchar',
    length: 20,
    default: InventoryReservationStatus.ACTIVE,
  })
  status!: InventoryReservationStatus;

  @Column({
    type: 'int',
  })
  created_by_user_id!: number;

  @ManyToOne(() => User, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'created_by_user_id',
  })
  created_by_user?: User;

  @Column({
    type: 'int',
    nullable: true,
  })
  released_by_user_id!: number | null;

  @ManyToOne(() => User, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({
    name: 'released_by_user_id',
  })
  released_by_user?: User | null;

  @Column({
    type: 'int',
    nullable: true,
  })
  consumed_by_user_id!: number | null;

  @ManyToOne(() => User, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({
    name: 'consumed_by_user_id',
  })
  consumed_by_user?: User | null;

  @CreateDateColumn({
    type: 'timestamptz',
  })
  created_at!: Date;

  @UpdateDateColumn({
    type: 'timestamptz',
  })
  updated_at!: Date;
}
