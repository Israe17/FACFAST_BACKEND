import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Business } from '../../common/entities/business.entity';
import { AuditedCodeEntity } from '../../common/entities/audited-code.entity';
import { Brand } from './brand.entity';
import { InventoryLot } from './inventory-lot.entity';
import { InventoryMovement } from './inventory-movement.entity';
import { MeasurementUnit } from './measurement-unit.entity';
import { ProductPrice } from './product-price.entity';
import { ProductCategory } from './product-category.entity';
import { ProductType } from '../enums/product-type.enum';
import { PromotionItem } from './promotion-item.entity';
import { TaxProfile } from './tax-profile.entity';
import { WarehouseStock } from './warehouse-stock.entity';
import { WarrantyProfile } from './warranty-profile.entity';

@Entity('products')
@Index(['business_id', 'sku'], { unique: true })
@Index(['business_id', 'barcode'], { unique: true })
export class Product extends AuditedCodeEntity {
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
    type: 'enum',
    enum: ProductType,
  })
  type!: ProductType;

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
    type: 'int',
    nullable: true,
  })
  category_id!: number | null;

  @ManyToOne(() => ProductCategory, (category) => category.products, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({
    name: 'category_id',
  })
  category?: ProductCategory | null;

  @Column({
    type: 'int',
    nullable: true,
  })
  brand_id!: number | null;

  @ManyToOne(() => Brand, (brand) => brand.products, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({
    name: 'brand_id',
  })
  brand?: Brand | null;

  @Column({
    type: 'varchar',
    length: 80,
    nullable: true,
  })
  sku!: string | null;

  @Column({
    type: 'varchar',
    length: 80,
    nullable: true,
  })
  barcode!: string | null;

  @Column({
    type: 'int',
    nullable: true,
  })
  stock_unit_id!: number | null;

  @ManyToOne(
    () => MeasurementUnit,
    (measurement_unit) => measurement_unit.stock_unit_products,
    {
      onDelete: 'SET NULL',
    },
  )
  @JoinColumn({
    name: 'stock_unit_id',
  })
  stock_unit?: MeasurementUnit | null;

  @Column({
    type: 'int',
    nullable: true,
  })
  sale_unit_id!: number | null;

  @ManyToOne(
    () => MeasurementUnit,
    (measurement_unit) => measurement_unit.sale_unit_products,
    {
      onDelete: 'SET NULL',
    },
  )
  @JoinColumn({
    name: 'sale_unit_id',
  })
  sale_unit?: MeasurementUnit | null;

  @Column({
    type: 'int',
  })
  tax_profile_id!: number;

  @ManyToOne(() => TaxProfile, (tax_profile) => tax_profile.products, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'tax_profile_id',
  })
  tax_profile?: TaxProfile;

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
  has_warranty!: boolean;

  @Column({
    type: 'int',
    nullable: true,
  })
  warranty_profile_id!: number | null;

  @ManyToOne(
    () => WarrantyProfile,
    (warranty_profile) => warranty_profile.products,
    {
      onDelete: 'SET NULL',
    },
  )
  @JoinColumn({
    name: 'warranty_profile_id',
  })
  warranty_profile?: WarrantyProfile | null;

  @Column({
    type: 'boolean',
    default: true,
  })
  is_active!: boolean;

  @OneToMany(() => ProductPrice, (product_price) => product_price.product)
  product_prices?: ProductPrice[];

  @OneToMany(() => PromotionItem, (promotion_item) => promotion_item.product)
  promotion_items?: PromotionItem[];

  @OneToMany(() => WarehouseStock, (warehouse_stock) => warehouse_stock.product)
  warehouse_stock?: WarehouseStock[];

  @OneToMany(() => InventoryLot, (inventory_lot) => inventory_lot.product)
  inventory_lots?: InventoryLot[];

  @OneToMany(
    () => InventoryMovement,
    (inventory_movement) => inventory_movement.product,
  )
  inventory_movements?: InventoryMovement[];
}
