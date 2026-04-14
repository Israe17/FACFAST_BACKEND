import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ProductSerial } from '../../inventory/entities/product-serial.entity';
import { SaleOrderLine } from './sale-order-line.entity';

@Entity('sale_order_line_serials')
@Index(['sale_order_line_id', 'product_serial_id'], { unique: true })
@Index(['product_serial_id'])
export class SaleOrderLineSerial {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  business_id!: number;

  @Column({ type: 'int' })
  sale_order_line_id!: number;

  @ManyToOne(() => SaleOrderLine, (line) => line.assigned_serials, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'sale_order_line_id' })
  sale_order_line?: SaleOrderLine;

  @Column({ type: 'int' })
  product_serial_id!: number;

  @ManyToOne(() => ProductSerial, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'product_serial_id' })
  product_serial?: ProductSerial;

  @Column({ type: 'timestamptz', nullable: true })
  assigned_at!: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;
}
