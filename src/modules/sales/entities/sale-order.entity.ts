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
import { Contact } from '../../contacts/entities/contact.entity';
import { Warehouse } from '../../inventory/entities/warehouse.entity';
import { Zone } from '../../inventory/entities/zone.entity';
import { User } from '../../users/entities/user.entity';
import { FulfillmentMode } from '../enums/fulfillment-mode.enum';
import { SaleDispatchStatus } from '../enums/sale-dispatch-status.enum';
import { SaleMode } from '../enums/sale-mode.enum';
import { SaleOrderStatus } from '../enums/sale-order-status.enum';
import { SaleOrderDeliveryCharge } from './sale-order-delivery-charge.entity';
import { SaleOrderLine } from './sale-order-line.entity';

@Entity('sale_orders')
@Index(['business_id', 'code'], { unique: true })
@Index(['business_id', 'order_date'])
@Index(['business_id', 'dispatch_status'])
@Index(['business_id', 'customer_contact_id'])
export class SaleOrder extends AuditedCodeEntity {
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
  customer_contact_id!: number;

  @ManyToOne(() => Contact, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'customer_contact_id',
  })
  customer_contact?: Contact;

  @Column({
    type: 'int',
    nullable: true,
  })
  seller_user_id!: number | null;

  @ManyToOne(() => User, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({
    name: 'seller_user_id',
  })
  seller?: User | null;

  @Column({
    type: 'varchar',
    length: 30,
  })
  sale_mode!: SaleMode;

  @Column({
    type: 'varchar',
    length: 20,
  })
  fulfillment_mode!: FulfillmentMode;

  @Column({
    type: 'varchar',
    length: 20,
    default: SaleOrderStatus.DRAFT,
  })
  status!: SaleOrderStatus;

  @Column({
    type: 'varchar',
    length: 20,
    default: SaleDispatchStatus.PENDING,
  })
  dispatch_status!: SaleDispatchStatus;

  @Column({
    type: 'timestamptz',
  })
  order_date!: Date;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  delivery_address!: string | null;

  @Column({
    type: 'varchar',
    length: 120,
    nullable: true,
  })
  delivery_province!: string | null;

  @Column({
    type: 'varchar',
    length: 120,
    nullable: true,
  })
  delivery_canton!: string | null;

  @Column({
    type: 'varchar',
    length: 120,
    nullable: true,
  })
  delivery_district!: string | null;

  @Column({
    type: 'int',
    nullable: true,
  })
  delivery_zone_id!: number | null;

  @ManyToOne(() => Zone, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({
    name: 'delivery_zone_id',
  })
  delivery_zone?: Zone | null;

  @Column({
    type: 'date',
    nullable: true,
  })
  delivery_requested_date!: string | null;

  @Column({
    type: 'int',
    nullable: true,
  })
  warehouse_id!: number | null;

  @ManyToOne(() => Warehouse, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({
    name: 'warehouse_id',
  })
  warehouse?: Warehouse | null;

  @Column({
    type: 'text',
    nullable: true,
  })
  notes!: string | null;

  @Column({
    type: 'text',
    nullable: true,
  })
  internal_notes!: string | null;

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

  @OneToMany(() => SaleOrderLine, (line) => line.sale_order)
  lines?: SaleOrderLine[];

  @OneToMany(() => SaleOrderDeliveryCharge, (charge) => charge.sale_order)
  delivery_charges?: SaleOrderDeliveryCharge[];
}
