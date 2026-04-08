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
import { Zone } from '../entities/zone.entity';
import { User } from '../../users/entities/user.entity';
import { Vehicle } from '../entities/vehicle.entity';
import { RouteBranchLink } from './route-branch-link.entity';

@Entity('routes')
@Index(['business_id', 'name'], { unique: true })
@Index(['business_id', 'code'], { unique: true })
export class Route extends AuditedCodeEntity {
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
    type: 'int',
    nullable: true,
  })
  zone_id!: number | null;

  @ManyToOne(() => Zone, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({
    name: 'zone_id',
  })
  zone?: Zone | null;

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
    type: 'int',
    nullable: true,
  })
  default_driver_user_id!: number | null;

  @ManyToOne(() => User, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({
    name: 'default_driver_user_id',
  })
  default_driver?: User | null;

  @Column({
    type: 'int',
    nullable: true,
  })
  default_vehicle_id!: number | null;

  @ManyToOne(() => Vehicle, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({
    name: 'default_vehicle_id',
  })
  default_vehicle?: Vehicle | null;

  @Column({
    type: 'numeric',
    precision: 14,
    scale: 2,
    nullable: true,
    transformer: {
      to: (value: number | null) => value,
      from: (value: string | null) => (value !== null ? parseFloat(value) : null),
    },
  })
  estimated_cost!: number | null;

  @Column({
    type: 'varchar',
    length: 80,
    nullable: true,
  })
  frequency!: string | null;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  day_of_week!: string | null;

  @Column({
    type: 'boolean',
    default: true,
  })
  is_active!: boolean;

  @Column({
    type: 'jsonb',
    nullable: true,
  })
  waypoints!: { lat: number; lng: number; label?: string }[] | null;

  @OneToMany(() => RouteBranchLink, (branch_link) => branch_link.route)
  branch_links?: RouteBranchLink[];
}
