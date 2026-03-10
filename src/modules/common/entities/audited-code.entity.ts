import { CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { BaseCodeEntity } from './base-code.entity';

export abstract class AuditedCodeEntity extends BaseCodeEntity {
  @CreateDateColumn({
    type: 'timestamptz',
  })
  created_at!: Date;

  @UpdateDateColumn({
    type: 'timestamptz',
  })
  updated_at!: Date;
}
