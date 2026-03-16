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
import { Product } from './product.entity';

@Entity('measurement_units')
@Index(['business_id', 'name'], { unique: true })
@Index(['business_id', 'symbol'], { unique: true })
@Index(['business_id', 'code'], { unique: true })
export class MeasurementUnit extends AuditedCodeEntity {
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
    length: 120,
  })
  name!: string;

  @Column({
    type: 'varchar',
    length: 32,
  })
  symbol!: string;

  @Column({
    type: 'boolean',
    default: true,
  })
  is_active!: boolean;

  @OneToMany(() => Product, (product) => product.stock_unit)
  stock_unit_products?: Product[];

  @OneToMany(() => Product, (product) => product.sale_unit)
  sale_unit_products?: Product[];
}
