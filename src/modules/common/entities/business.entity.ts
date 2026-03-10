import { Column, Entity } from 'typeorm';
import { AuditedCodeEntity } from './audited-code.entity';

@Entity('businesses')
export class Business extends AuditedCodeEntity {
  @Column({
    type: 'varchar',
    length: 160,
  })
  name!: string;

  @Column({
    type: 'varchar',
    length: 160,
  })
  legal_name!: string;

  @Column({
    type: 'boolean',
    default: true,
  })
  is_active!: boolean;
}
