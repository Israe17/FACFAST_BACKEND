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
import { ProductVariant } from './product-variant.entity';
import { Warehouse } from './warehouse.entity';
import { SerialStatus } from '../enums/serial-status.enum';
import { SerialEvent } from './serial-event.entity';

@Entity('product_serials')
@Index(['business_id', 'product_variant_id', 'serial_number'], { unique: true })
@Index(['business_id', 'serial_number'])
@Index(['business_id', 'status'])
@Index(['warehouse_id', 'status'])
export class ProductSerial {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  business_id!: number;

  @ManyToOne(() => Business, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'business_id' })
  business?: Business;

  @Column({ type: 'int' })
  product_variant_id!: number;

  @ManyToOne(() => ProductVariant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_variant_id' })
  product_variant?: ProductVariant;

  @Column({ type: 'varchar', length: 200 })
  serial_number!: string;

  @Column({ type: 'int', nullable: true })
  warehouse_id!: number | null;

  @ManyToOne(() => Warehouse, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'warehouse_id' })
  warehouse?: Warehouse | null;

  @Column({ type: 'enum', enum: SerialStatus, default: SerialStatus.AVAILABLE })
  status!: SerialStatus;

  @Column({ type: 'timestamptz', nullable: true })
  received_at!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  sold_at!: Date | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;

  @OneToMany(() => SerialEvent, (event) => event.serial)
  events?: SerialEvent[];
}
