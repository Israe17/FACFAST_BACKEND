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

@Entity('product_categories')
@Index(['business_id', 'parent_id', 'name'], { unique: true })
@Index(['business_id', 'code'], { unique: true })
export class ProductCategory extends AuditedCodeEntity {
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
    type: 'int',
    nullable: true,
  })
  parent_id!: number | null;

  @ManyToOne(() => ProductCategory, (category) => category.children, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({
    name: 'parent_id',
  })
  parent?: ProductCategory | null;

  @OneToMany(() => ProductCategory, (category) => category.parent)
  children?: ProductCategory[];

  @Column({
    type: 'int',
    nullable: true,
  })
  level!: number | null;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  path!: string | null;

  @Column({
    type: 'boolean',
    default: true,
  })
  is_active!: boolean;

  @OneToMany(() => Product, (product) => product.category)
  products?: Product[];
}
