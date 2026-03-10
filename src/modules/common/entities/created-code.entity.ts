import { CreateDateColumn } from 'typeorm';
import { BaseCodeEntity } from './base-code.entity';

export abstract class CreatedCodeEntity extends BaseCodeEntity {
  @CreateDateColumn({
    type: 'timestamptz',
  })
  created_at!: Date;
}
