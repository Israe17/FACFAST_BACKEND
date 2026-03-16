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
import { Warehouse } from './warehouse.entity';

@Entity('warehouse_locations')
@Index(['business_id', 'code'], { unique: true })
@Index(['warehouse_id', 'name'], { unique: true })
export class WarehouseLocation extends AuditedCodeEntity {
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

  @ManyToOne(() => Warehouse, (warehouse) => warehouse.locations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'warehouse_id',
  })
  warehouse?: Warehouse;

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
    type: 'varchar',
    length: 80,
    nullable: true,
  })
  zone!: string | null;

  @Column({
    type: 'varchar',
    length: 80,
    nullable: true,
  })
  aisle!: string | null;

  @Column({
    type: 'varchar',
    length: 80,
    nullable: true,
  })
  rack!: string | null;

  @Column({
    type: 'varchar',
    length: 80,
    nullable: true,
  })
  level!: string | null;

  @Column({
    type: 'varchar',
    length: 80,
    nullable: true,
  })
  position!: string | null;

  @Column({
    type: 'varchar',
    length: 120,
    nullable: true,
  })
  barcode!: string | null;

  @Column({
    type: 'boolean',
    default: false,
  })
  is_picking_area!: boolean;

  @Column({
    type: 'boolean',
    default: false,
  })
  is_receiving_area!: boolean;

  @Column({
    type: 'boolean',
    default: false,
  })
  is_dispatch_area!: boolean;

  @Column({
    type: 'boolean',
    default: true,
  })
  is_active!: boolean;

  @OneToMany(() => InventoryLot, (inventory_lot) => inventory_lot.location)
  inventory_lots?: InventoryLot[];

  @OneToMany(
    () => InventoryMovement,
    (inventory_movement) => inventory_movement.location,
  )
  inventory_movements?: InventoryMovement[];
}
