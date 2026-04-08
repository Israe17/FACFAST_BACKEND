import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Business } from '../../common/entities/business.entity';
import { AuditedCodeEntity } from '../../common/entities/audited-code.entity';
import { numeric_transformer } from '../../common/utils/numeric.transformer';
import { ZoneBranchLink } from './zone-branch-link.entity';

@Entity('zones')
@Index(['business_id', 'name'], { unique: true })
@Index(['business_id', 'code'], { unique: true })
export class Zone extends AuditedCodeEntity {
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
    type: 'boolean',
    default: true,
  })
  is_global!: boolean;

  @Column({
    type: 'varchar',
    length: 150,
  })
  name!: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  description!: string | null;

  @Column({
    type: 'varchar',
    length: 120,
    nullable: true,
  })
  province!: string | null;

  @Column({
    type: 'varchar',
    length: 120,
    nullable: true,
  })
  canton!: string | null;

  @Column({
    type: 'varchar',
    length: 120,
    nullable: true,
  })
  district!: string | null;

  @Column({
    type: 'boolean',
    default: true,
  })
  is_active!: boolean;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 7,
    nullable: true,
    transformer: numeric_transformer,
  })
  center_latitude!: number | null;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 7,
    nullable: true,
    transformer: numeric_transformer,
  })
  center_longitude!: number | null;

  @OneToMany(() => ZoneBranchLink, (branch_link) => branch_link.zone)
  branch_links?: ZoneBranchLink[];
}
