import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { numeric_transformer } from '../../common/utils/numeric.transformer';
import { ProductVariant } from './product-variant.entity';
import { DispatchStop } from './dispatch-stop.entity';

@Entity('dispatch_stop_lines')
export class DispatchStopLine {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  business_id!: number;

  @Column({ type: 'int' })
  dispatch_stop_id!: number;

  @ManyToOne(() => DispatchStop, (stop) => stop.lines, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'dispatch_stop_id' })
  dispatch_stop?: DispatchStop;

  @Column({ type: 'int' })
  sale_order_line_id!: number;

  @Column({ type: 'int' })
  product_variant_id!: number;

  @ManyToOne(() => ProductVariant, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'product_variant_id' })
  product_variant?: ProductVariant;

  @Column({
    type: 'numeric',
    precision: 18,
    scale: 4,
    transformer: numeric_transformer,
  })
  ordered_quantity!: number;

  @Column({
    type: 'numeric',
    precision: 18,
    scale: 4,
    nullable: true,
    transformer: numeric_transformer,
  })
  delivered_quantity!: number | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
