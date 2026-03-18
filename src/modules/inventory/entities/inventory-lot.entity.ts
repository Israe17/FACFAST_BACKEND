import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Branch } from '../../branches/entities/branch.entity';
import { Business } from '../../common/entities/business.entity';
import { AuditedCodeEntity } from '../../common/entities/audited-code.entity';
import { numeric_transformer } from '../../common/utils/numeric.transformer';
import { Contact } from '../../contacts/entities/contact.entity';
import { InventoryMovement } from './inventory-movement.entity';
import { Product } from './product.entity';
import { ProductVariant } from './product-variant.entity';
import { WarehouseLocation } from './warehouse-location.entity';
import { Warehouse } from './warehouse.entity';

@Entity('inventory_lots')
@Index(['business_id', 'code'], { unique: true })
@Index(['warehouse_id', 'product_id', 'lot_number'], { unique: true })
@Index(['business_id', 'created_at'])
@Index(['business_id', 'product_id'])
export class InventoryLot extends AuditedCodeEntity {
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

  @ManyToOne(() => Warehouse, (warehouse) => warehouse.inventory_lots, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'warehouse_id',
  })
  warehouse?: Warehouse;

  @Column({
    type: 'int',
    nullable: true,
  })
  location_id!: number | null;

  @ManyToOne(() => WarehouseLocation, (location) => location.inventory_lots, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({
    name: 'location_id',
  })
  location?: WarehouseLocation | null;

  @Column({
    type: 'int',
  })
  product_id!: number;

  @ManyToOne(() => Product, (product) => product.inventory_lots, {
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
    type: 'varchar',
    length: 120,
  })
  lot_number!: string;

  @Column({
    type: 'date',
    nullable: true,
  })
  expiration_date!: string | null;

  @Column({
    type: 'date',
    nullable: true,
  })
  manufacturing_date!: string | null;

  @Column({
    type: 'timestamptz',
    nullable: true,
  })
  received_at!: Date | null;

  @Column({
    type: 'numeric',
    precision: 14,
    scale: 4,
    transformer: numeric_transformer,
  })
  initial_quantity!: number;

  @Column({
    type: 'numeric',
    precision: 14,
    scale: 4,
    default: 0,
    transformer: numeric_transformer,
  })
  current_quantity!: number;

  @Column({
    type: 'numeric',
    precision: 14,
    scale: 4,
    nullable: true,
    transformer: numeric_transformer,
  })
  unit_cost!: number | null;

  @Column({
    type: 'int',
    nullable: true,
  })
  supplier_contact_id!: number | null;

  @ManyToOne(() => Contact, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({
    name: 'supplier_contact_id',
  })
  supplier_contact?: Contact | null;

  @Column({
    type: 'boolean',
    default: true,
  })
  is_active!: boolean;

  @OneToMany(
    () => InventoryMovement,
    (inventory_movement) => inventory_movement.inventory_lot,
  )
  inventory_movements?: InventoryMovement[];
}
