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
import { VehicleBranchLink } from './vehicle-branch-link.entity';

@Entity('vehicles')
@Index(['business_id', 'plate_number'], { unique: true })
@Index(['business_id', 'code'], { unique: true })
export class Vehicle extends AuditedCodeEntity {
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
    length: 20,
  })
  plate_number!: string;

  @Column({
    type: 'varchar',
    length: 150,
  })
  name!: string;

  @Column({
    type: 'varchar',
    length: 80,
    nullable: true,
  })
  vehicle_type!: string | null;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  max_weight_kg!: number | null;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  max_volume_m3!: number | null;

  @Column({
    type: 'boolean',
    default: true,
  })
  is_active!: boolean;

  @Column({
    type: 'text',
    nullable: true,
  })
  notes!: string | null;

  @OneToMany(() => VehicleBranchLink, (branch_link) => branch_link.vehicle)
  branch_links?: VehicleBranchLink[];
}
