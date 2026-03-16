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
import { InventoryLot } from './inventory-lot.entity';
import { InventoryMovement } from './inventory-movement.entity';
import { InventoryBalance } from './inventory-balance.entity';
import { InventoryMovementLine } from './inventory-movement-line.entity';
import { WarehousePurpose } from '../enums/warehouse-purpose.enum';
import { WarehouseLocation } from './warehouse-location.entity';
import { WarehouseBranchLink } from './warehouse-branch-link.entity';
import { WarehouseStock } from './warehouse-stock.entity';

@Entity('warehouses')
@Index(['business_id', 'code'], { unique: true })
@Index(['branch_id', 'name'], { unique: true })
export class Warehouse extends AuditedCodeEntity {
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
    type: 'varchar',
    length: 160,
  })
  name!: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  description!: string | null;

  @Column({
    type: 'enum',
    enum: WarehousePurpose,
    default: WarehousePurpose.GENERAL_STORAGE,
  })
  purpose!: WarehousePurpose;

  @Column({
    type: 'boolean',
    default: false,
  })
  uses_locations!: boolean;

  @Column({
    type: 'boolean',
    default: false,
  })
  is_default!: boolean;

  @Column({
    type: 'boolean',
    default: true,
  })
  is_active!: boolean;

  @OneToMany(() => WarehouseLocation, (location) => location.warehouse)
  locations?: WarehouseLocation[];

  @OneToMany(() => WarehouseBranchLink, (branch_link) => branch_link.warehouse)
  branch_links?: WarehouseBranchLink[];

  @OneToMany(
    () => WarehouseStock,
    (warehouse_stock) => warehouse_stock.warehouse,
  )
  warehouse_stock?: WarehouseStock[];

  @OneToMany(
    () => InventoryBalance,
    (inventory_balance) => inventory_balance.warehouse,
  )
  inventory_balances?: InventoryBalance[];

  @OneToMany(() => InventoryLot, (inventory_lot) => inventory_lot.warehouse)
  inventory_lots?: InventoryLot[];

  @OneToMany(
    () => InventoryMovement,
    (inventory_movement) => inventory_movement.warehouse,
  )
  inventory_movements?: InventoryMovement[];

  @OneToMany(
    () => InventoryMovementLine,
    (inventory_movement_line) => inventory_movement_line.warehouse,
  )
  inventory_movement_lines?: InventoryMovementLine[];
}
