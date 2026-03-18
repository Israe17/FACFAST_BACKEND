import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Business } from '../../common/entities/business.entity';
import { ProductSerial } from './product-serial.entity';
import { Warehouse } from './warehouse.entity';
import { InventoryMovementHeader } from './inventory-movement-header.entity';
import { SerialEventType } from '../enums/serial-event-type.enum';

@Entity('serial_events')
@Index(['serial_id', 'occurred_at'])
export class SerialEvent {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  business_id!: number;

  @ManyToOne(() => Business, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'business_id' })
  business?: Business;

  @Column({ type: 'int' })
  serial_id!: number;

  @ManyToOne(() => ProductSerial, (serial) => serial.events, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'serial_id' })
  serial?: ProductSerial;

  @Column({ type: 'enum', enum: SerialEventType })
  event_type!: SerialEventType;

  @Column({ type: 'int', nullable: true })
  from_warehouse_id!: number | null;

  @ManyToOne(() => Warehouse, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'from_warehouse_id' })
  from_warehouse?: Warehouse | null;

  @Column({ type: 'int', nullable: true })
  to_warehouse_id!: number | null;

  @ManyToOne(() => Warehouse, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'to_warehouse_id' })
  to_warehouse?: Warehouse | null;

  @Column({ type: 'int', nullable: true })
  contact_id!: number | null;

  @Column({ type: 'int', nullable: true })
  movement_header_id!: number | null;

  @ManyToOne(() => InventoryMovementHeader, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'movement_header_id' })
  movement_header?: InventoryMovementHeader | null;

  @Column({ type: 'int', nullable: true })
  performed_by_user_id!: number | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ type: 'timestamptz' })
  occurred_at!: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;
}
