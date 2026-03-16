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
import { WarrantyDurationUnit } from '../enums/warranty-duration-unit.enum';
import { Product } from './product.entity';

@Entity('warranty_profiles')
@Index(['business_id', 'name'], { unique: true })
@Index(['business_id', 'code'], { unique: true })
export class WarrantyProfile extends AuditedCodeEntity {
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
    type: 'varchar',
    length: 160,
  })
  name!: string;

  @Column({
    type: 'int',
  })
  duration_value!: number;

  @Column({
    type: 'enum',
    enum: WarrantyDurationUnit,
  })
  duration_unit!: WarrantyDurationUnit;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  coverage_notes!: string | null;

  @Column({
    type: 'boolean',
    default: true,
  })
  is_active!: boolean;

  @OneToMany(() => Product, (product) => product.warranty_profile)
  products?: Product[];
}
