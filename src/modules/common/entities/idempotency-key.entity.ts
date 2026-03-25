import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { IdempotencyKeyStatus } from '../enums/idempotency-key-status.enum';

@Entity('idempotency_keys')
@Index(['business_id', 'user_id', 'scope', 'idempotency_key'], {
  unique: true,
})
@Index(['scope', 'status', 'updated_at'])
export class IdempotencyKey {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    type: 'int',
    nullable: true,
  })
  business_id!: number | null;

  @Column({
    type: 'int',
    nullable: true,
  })
  user_id!: number | null;

  @Column({
    type: 'varchar',
    length: 120,
  })
  scope!: string;

  @Column({
    type: 'varchar',
    length: 160,
  })
  idempotency_key!: string;

  @Column({
    type: 'varchar',
    length: 128,
  })
  request_hash!: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: IdempotencyKeyStatus.PROCESSING,
  })
  status!: IdempotencyKeyStatus;

  @Column({
    type: 'jsonb',
    nullable: true,
  })
  response_payload!: Record<string, unknown> | null;

  @CreateDateColumn({
    type: 'timestamptz',
  })
  created_at!: Date;

  @UpdateDateColumn({
    type: 'timestamptz',
  })
  updated_at!: Date;
}
