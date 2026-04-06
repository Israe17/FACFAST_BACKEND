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
import { Contact } from '../../contacts/entities/contact.entity';
import { SaleOrder } from '../../sales/entities/sale-order.entity';
import { DispatchStopStatus } from '../enums/dispatch-stop-status.enum';
import { DispatchOrder } from './dispatch-order.entity';
import { DispatchStopLine } from './dispatch-stop-line.entity';

@Entity('dispatch_stops')
@Index(['dispatch_order_id', 'sale_order_id'], { unique: true })
export class DispatchStop {
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
  dispatch_order_id!: number;

  @ManyToOne(() => DispatchOrder, (order) => order.stops, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'dispatch_order_id',
  })
  dispatch_order?: DispatchOrder;

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
  })
  delivery_sequence!: number;

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
    type: 'varchar',
    length: 20,
    default: DispatchStopStatus.PENDING,
  })
  status!: DispatchStopStatus;

  @Column({
    type: 'timestamptz',
    nullable: true,
  })
  delivered_at!: Date | null;

  @Column({
    type: 'varchar',
    length: 160,
    nullable: true,
  })
  received_by!: string | null;

  @Column({
    type: 'text',
    nullable: true,
  })
  failure_reason!: string | null;

  @Column({
    type: 'text',
    nullable: true,
  })
  notes!: string | null;

  @OneToMany(() => DispatchStopLine, (line) => line.dispatch_stop, {
    cascade: true,
  })
  lines?: DispatchStopLine[];

  @CreateDateColumn({
    type: 'timestamptz',
  })
  created_at!: Date;

  @UpdateDateColumn({
    type: 'timestamptz',
  })
  updated_at!: Date;
}
