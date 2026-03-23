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
import { User } from '../../users/entities/user.entity';
import { DispatchOrderStatus } from '../enums/dispatch-order-status.enum';
import { DispatchType } from '../enums/dispatch-type.enum';
import { Route } from './route.entity';
import { Vehicle } from './vehicle.entity';
import { Warehouse } from './warehouse.entity';
import { DispatchStop } from './dispatch-stop.entity';
import { DispatchExpense } from './dispatch-expense.entity';

@Entity('dispatch_orders')
@Index(['business_id', 'code'], { unique: true })
@Index(['business_id', 'status'])
@Index(['business_id', 'scheduled_date'])
export class DispatchOrder extends AuditedCodeEntity {
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
    length: 20,
  })
  dispatch_type!: DispatchType;

  @Column({
    type: 'varchar',
    length: 20,
    default: DispatchOrderStatus.DRAFT,
  })
  status!: DispatchOrderStatus;

  @Column({
    type: 'int',
    nullable: true,
  })
  route_id!: number | null;

  @ManyToOne(() => Route, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({
    name: 'route_id',
  })
  route?: Route | null;

  @Column({
    type: 'int',
    nullable: true,
  })
  vehicle_id!: number | null;

  @ManyToOne(() => Vehicle, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({
    name: 'vehicle_id',
  })
  vehicle?: Vehicle | null;

  @Column({
    type: 'int',
    nullable: true,
  })
  driver_user_id!: number | null;

  @ManyToOne(() => User, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({
    name: 'driver_user_id',
  })
  driver_user?: User | null;

  @Column({
    type: 'int',
    nullable: true,
  })
  origin_warehouse_id!: number | null;

  @ManyToOne(() => Warehouse, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({
    name: 'origin_warehouse_id',
  })
  origin_warehouse?: Warehouse | null;

  @Column({
    type: 'date',
    nullable: true,
  })
  scheduled_date!: string | null;

  @Column({
    type: 'timestamptz',
    nullable: true,
  })
  dispatched_at!: Date | null;

  @Column({
    type: 'timestamptz',
    nullable: true,
  })
  completed_at!: Date | null;

  @Column({
    type: 'text',
    nullable: true,
  })
  notes!: string | null;

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

  @OneToMany(() => DispatchStop, (stop) => stop.dispatch_order)
  stops?: DispatchStop[];

  @OneToMany(() => DispatchExpense, (expense) => expense.dispatch_order)
  expenses?: DispatchExpense[];
}
