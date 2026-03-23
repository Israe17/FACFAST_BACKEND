import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Business } from '../../common/entities/business.entity';
import { User } from '../../users/entities/user.entity';
import { numeric_transformer } from '../../common/utils/numeric.transformer';
import { DispatchExpenseType } from '../enums/dispatch-expense-type.enum';
import { DispatchOrder } from './dispatch-order.entity';

@Entity('dispatch_expenses')
export class DispatchExpense {
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

  @ManyToOne(() => DispatchOrder, (order) => order.expenses, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'dispatch_order_id',
  })
  dispatch_order?: DispatchOrder;

  @Column({
    type: 'varchar',
    length: 30,
  })
  expense_type!: DispatchExpenseType;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  description!: string | null;

  @Column({
    type: 'numeric',
    precision: 14,
    scale: 2,
    transformer: numeric_transformer,
  })
  amount!: number;

  @Column({
    type: 'varchar',
    length: 80,
    nullable: true,
  })
  receipt_number!: string | null;

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

  @CreateDateColumn({
    type: 'timestamptz',
  })
  created_at!: Date;

  @UpdateDateColumn({
    type: 'timestamptz',
  })
  updated_at!: Date;
}
