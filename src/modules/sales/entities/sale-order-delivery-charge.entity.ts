import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Business } from '../../common/entities/business.entity';
import { numeric_transformer } from '../../common/utils/numeric.transformer';
import { DeliveryChargeType } from '../enums/delivery-charge-type.enum';
import { SaleOrder } from './sale-order.entity';

@Entity('sale_order_delivery_charges')
@Index(['business_id', 'sale_order_id'])
export class SaleOrderDeliveryCharge {
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
  sale_order_id!: number;

  @ManyToOne(() => SaleOrder, (order) => order.delivery_charges, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'sale_order_id',
  })
  sale_order?: SaleOrder;

  @Column({
    type: 'varchar',
    length: 30,
  })
  charge_type!: DeliveryChargeType;

  @Column({
    type: 'numeric',
    precision: 18,
    scale: 4,
    transformer: numeric_transformer,
  })
  amount!: number;

  @Column({
    type: 'text',
    nullable: true,
  })
  notes!: string | null;

  @CreateDateColumn({
    type: 'timestamptz',
  })
  created_at!: Date;

  @UpdateDateColumn({
    type: 'timestamptz',
  })
  updated_at!: Date;
}
