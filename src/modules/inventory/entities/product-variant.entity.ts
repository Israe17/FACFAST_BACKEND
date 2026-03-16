import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Business } from '../../common/entities/business.entity';
import { MeasurementUnit } from './measurement-unit.entity';
import { TaxProfile } from './tax-profile.entity';
import { Product } from './product.entity';
import { WarrantyProfile } from './warranty-profile.entity';
import { InventoryBalance } from './inventory-balance.entity';
import { InventoryMovementLine } from './inventory-movement-line.entity';

@Entity('product_variants')
@Index(['business_id', 'sku'], { unique: true })
@Index(['business_id', 'barcode'], { unique: true })
export class ProductVariant {
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

  @ManyToOne(() => Product, (product) => product.variants, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'product_id',
  })
  product?: Product;

  @Column({
    type: 'varchar',
    length: 100,
  })
  sku!: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  barcode!: string | null;

  @Column({
    type: 'varchar',
    length: 150,
    nullable: true,
  })
  variant_name!: string | null;

  @Column({
    type: 'int',
    nullable: true,
  })
  stock_unit_measure_id!: number | null;

  @ManyToOne(() => MeasurementUnit, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({
    name: 'stock_unit_measure_id',
  })
  stock_unit_measure?: MeasurementUnit | null;

  @Column({
    type: 'int',
    nullable: true,
  })
  sale_unit_measure_id!: number | null;

  @ManyToOne(() => MeasurementUnit, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({
    name: 'sale_unit_measure_id',
  })
  sale_unit_measure?: MeasurementUnit | null;

  @Column({
    type: 'int',
  })
  fiscal_profile_id!: number;

  @ManyToOne(() => TaxProfile, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'fiscal_profile_id',
  })
  fiscal_profile?: TaxProfile;

  @Column({
    type: 'int',
    nullable: true,
  })
  default_warranty_profile_id!: number | null;

  @ManyToOne(() => WarrantyProfile, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({
    name: 'default_warranty_profile_id',
  })
  default_warranty_profile?: WarrantyProfile | null;

  @Column({
    type: 'boolean',
    default: false,
  })
  is_default!: boolean;

  @Column({
    type: 'boolean',
    default: true,
  })
  track_inventory!: boolean;

  @Column({
    type: 'boolean',
    default: false,
  })
  track_lots!: boolean;

  @Column({
    type: 'boolean',
    default: false,
  })
  track_expiration!: boolean;

  @Column({
    type: 'boolean',
    default: false,
  })
  allow_negative_stock!: boolean;

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

  @OneToMany(() => InventoryBalance, (balance) => balance.product_variant)
  inventory_balances?: InventoryBalance[];

  @OneToMany(() => InventoryMovementLine, (line) => line.product_variant)
  inventory_movement_lines?: InventoryMovementLine[];
}
