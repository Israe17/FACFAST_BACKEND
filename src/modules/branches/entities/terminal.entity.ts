import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { AuditedCodeEntity } from '../../common/entities/audited-code.entity';
import { Branch } from './branch.entity';

@Entity('terminals')
@Index(['branch_id', 'terminal_number'], { unique: true })
export class Terminal extends AuditedCodeEntity {
  @Column({
    type: 'int',
  })
  branch_id!: number;

  @ManyToOne(() => Branch, (branch) => branch.terminals, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'branch_id',
  })
  branch?: Branch;

  @Column({
    type: 'varchar',
    length: 5,
  })
  terminal_number!: string;

  @Column({
    type: 'varchar',
    length: 120,
  })
  name!: string;

  @Column({
    type: 'boolean',
    default: true,
  })
  is_active!: boolean;
}
