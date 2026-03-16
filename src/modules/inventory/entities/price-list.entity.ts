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
import { PriceListKind } from '../enums/price-list-kind.enum';
import { ProductPrice } from './product-price.entity';

@Entity('price_lists')
@Index(['business_id', 'name'], { unique: true })
@Index(['business_id', 'code'], { unique: true })
export class PriceList extends AuditedCodeEntity {
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
    type: 'enum',
    enum: PriceListKind,
  })
  kind!: PriceListKind;

  @Column({
    type: 'varchar',
    length: 12,
  })
  currency!: string;

  @Column({
    type: 'boolean',
    default: false,
  })
  is_default!: boolean;

  @Column({
    type: 'boolean',
    default: true,
  })
  is_active!: boolean;

  @OneToMany(() => ProductPrice, (product_price) => product_price.price_list)
  product_prices?: ProductPrice[];
}
