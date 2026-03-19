import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
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
import { InventoryLot } from './inventory-lot.entity';
import { InventoryMovement } from './inventory-movement.entity';
import { InventoryMovementLine } from './inventory-movement-line.entity';
import { ProductPrice } from './product-price.entity';
import { VariantAttributeValue } from './variant-attribute-value.entity';
import { WarehouseStock } from './warehouse-stock.entity';

@Entity('product_variants')
@Index(['business_id', 'sku'], { unique: true })
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
    default: false,
  })
  track_serials!: boolean;

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

  @ManyToMany(() => VariantAttributeValue)
  @JoinTable({
    name: 'product_variant_attribute_values',
    joinColumn: { name: 'product_variant_id', referencedColumnName: 'id' },
    inverseJoinColumn: {
      name: 'attribute_value_id',
      referencedColumnName: 'id',
    },
  })
  attribute_values?: VariantAttributeValue[];

  @OneToMany(() => InventoryBalance, (balance) => balance.product_variant)
  inventory_balances?: InventoryBalance[];

  @OneToMany(() => InventoryMovementLine, (line) => line.product_variant)
  inventory_movement_lines?: InventoryMovementLine[];

  @OneToMany(() => WarehouseStock, (stock) => stock.product_variant)
  warehouse_stock?: WarehouseStock[];

  @OneToMany(() => InventoryMovement, (movement) => movement.product_variant)
  inventory_movements?: InventoryMovement[];

  @OneToMany(() => InventoryLot, (lot) => lot.product_variant)
  inventory_lots?: InventoryLot[];

  @OneToMany(() => ProductPrice, (price) => price.product_variant)
  product_prices?: ProductPrice[];
}
