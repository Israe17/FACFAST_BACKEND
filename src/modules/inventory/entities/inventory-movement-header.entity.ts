import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Branch } from '../../branches/entities/branch.entity';
import { Business } from '../../common/entities/business.entity';
import { AuditedCodeEntity } from '../../common/entities/audited-code.entity';
import { User } from '../../users/entities/user.entity';
import { InventoryMovementHeaderType } from '../enums/inventory-movement-header-type.enum';
import { InventoryMovementStatus } from '../enums/inventory-movement-status.enum';
import { InventoryMovementLine } from './inventory-movement-line.entity';

@Entity('inventory_movement_headers')
@Index(['business_id', 'code'], { unique: true })
@Index(['business_id', 'occurred_at'])
@Index(['business_id', 'movement_type', 'occurred_at'])
export class InventoryMovementHeader extends AuditedCodeEntity {
  @Column({
    type: 'int',
  })
  business_id!: number;

  @ManyToOne(() => Business, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'business_id',
  })
  business?: Business;

  @Column({
    type: 'enum',
    enum: InventoryMovementHeaderType,
  })
  movement_type!: InventoryMovementHeaderType;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  source_document_type!: string | null;

  @Column({
    type: 'int',
    nullable: true,
  })
  source_document_id!: number | null;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  source_document_number!: string | null;

  @Column({
    type: 'int',
    nullable: true,
  })
  branch_id!: number | null;

  @ManyToOne(() => Branch, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({
    name: 'branch_id',
  })
  branch?: Branch | null;

  @Column({
    type: 'enum',
    enum: InventoryMovementStatus,
    default: InventoryMovementStatus.DRAFT,
  })
  status!: InventoryMovementStatus;

  @Column({
    type: 'timestamptz',
  })
  occurred_at!: Date;

  @Column({
    type: 'int',
  })
  performed_by_user_id!: number;

  @ManyToOne(() => User, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'performed_by_user_id',
  })
  performed_by_user?: User;

  @Column({
    type: 'text',
    nullable: true,
  })
  notes!: string | null;

  @OneToMany(() => InventoryMovementLine, (line) => line.header)
  lines?: InventoryMovementLine[];
}
