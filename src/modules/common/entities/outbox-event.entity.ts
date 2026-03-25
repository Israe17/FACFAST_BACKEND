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
import { Business } from './business.entity';
import { OutboxEventStatus } from '../enums/outbox-event-status.enum';

@Entity('outbox_events')
@Index(['status', 'available_at', 'id'])
@Index(['business_id', 'aggregate_type', 'aggregate_id'])
@Index(['business_id', 'event_name', 'status'])
export class OutboxEvent {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    type: 'int',
    nullable: true,
  })
  business_id!: number | null;

  @ManyToOne(() => Business, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({
    name: 'business_id',
  })
  business?: Business | null;

  @Column({
    type: 'varchar',
    length: 120,
  })
  event_name!: string;

  @Column({
    type: 'varchar',
    length: 80,
  })
  aggregate_type!: string;

  @Column({
    type: 'varchar',
    length: 80,
  })
  aggregate_id!: string;

  @Column({
    type: 'jsonb',
  })
  payload!: Record<string, unknown>;

  @Column({
    type: 'varchar',
    length: 20,
    default: OutboxEventStatus.PENDING,
  })
  status!: OutboxEventStatus;

  @Column({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  available_at!: Date;

  @Column({
    type: 'timestamptz',
    nullable: true,
  })
  processed_at!: Date | null;

  @Column({
    type: 'int',
    default: 0,
  })
  attempts!: number;

  @Column({
    type: 'text',
    nullable: true,
  })
  last_error!: string | null;

  @CreateDateColumn({
    type: 'timestamptz',
  })
  created_at!: Date;

  @UpdateDateColumn({
    type: 'timestamptz',
  })
  updated_at!: Date;
}
