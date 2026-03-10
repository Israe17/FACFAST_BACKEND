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

@Entity('brands')
@Index(['business_id', 'name'], { unique: true })
export class Brand extends AuditedCodeEntity {
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
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  description!: string | null;

  @Column({
    type: 'boolean',
    default: true,
  })
  is_active!: boolean;

  @OneToMany(() => Product, (product) => product.brand)
  products?: Product[];
}
