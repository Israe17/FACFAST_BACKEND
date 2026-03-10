import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { Branch } from '../../branches/entities/branch.entity';
import { Business } from '../../common/entities/business.entity';
import { CreatedCodeEntity } from '../../common/entities/created-code.entity';
import { numeric_transformer } from '../../common/utils/numeric.transformer';
import { User } from '../../users/entities/user.entity';
import { InventoryMovementType } from '../enums/inventory-movement-type.enum';
import { InventoryLot } from './inventory-lot.entity';
import { Product } from './product.entity';
import { WarehouseLocation } from './warehouse-location.entity';
import { Warehouse } from './warehouse.entity';

@Entity('inventory_movements')
export class InventoryMovement extends CreatedCodeEntity {
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

  @ManyToOne(() => Warehouse, (warehouse) => warehouse.inventory_movements, {
    onDelete: 'RESTRICT',
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

  @ManyToOne(
    () => WarehouseLocation,
    (location) => location.inventory_movements,
    {
      onDelete: 'SET NULL',
    },
  )
  @JoinColumn({
    name: 'location_id',
  })
  location?: WarehouseLocation | null;

  @Column({
    type: 'int',
  })
  product_id!: number;

  @ManyToOne(() => Product, (product) => product.inventory_movements, {
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
  inventory_lot_id!: number | null;

  @ManyToOne(
    () => InventoryLot,
    (inventory_lot) => inventory_lot.inventory_movements,
    {
      onDelete: 'SET NULL',
    },
  )
  @JoinColumn({
    name: 'inventory_lot_id',
  })
  inventory_lot?: InventoryLot | null;

  @Column({
    type: 'enum',
    enum: InventoryMovementType,
  })
  movement_type!: InventoryMovementType;

  @Column({
    type: 'varchar',
    length: 80,
    nullable: true,
  })
  reference_type!: string | null;

  @Column({
    type: 'int',
    nullable: true,
  })
  reference_id!: number | null;

  @Column({
    type: 'numeric',
    precision: 14,
    scale: 4,
    transformer: numeric_transformer,
  })
  quantity!: number;

  @Column({
    type: 'numeric',
    precision: 14,
    scale: 4,
    transformer: numeric_transformer,
  })
  previous_quantity!: number;

  @Column({
    type: 'numeric',
    precision: 14,
    scale: 4,
    transformer: numeric_transformer,
  })
  new_quantity!: number;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  notes!: string | null;

  @Column({
    type: 'int',
  })
  created_by!: number;

  @ManyToOne(() => User, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'created_by',
  })
  created_by_user?: User;
}
