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
import { Product } from './product.entity';
import { TaxProfileItemKind } from '../enums/tax-profile-item-kind.enum';
import { TaxType } from '../enums/tax-type.enum';

@Entity('tax_profiles')
@Index(['business_id', 'name'], { unique: true })
@Index(['business_id', 'code'], { unique: true })
export class TaxProfile extends AuditedCodeEntity {
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
    type: 'varchar',
    length: 32,
  })
  cabys_code!: string;

  @Column({
    type: 'enum',
    enum: TaxProfileItemKind,
  })
  item_kind!: TaxProfileItemKind;

  @Column({
    type: 'enum',
    enum: TaxType,
  })
  tax_type!: TaxType;

  @Column({
    type: 'varchar',
    length: 32,
    nullable: true,
  })
  iva_rate_code!: string | null;

  @Column({
    type: 'numeric',
    precision: 7,
    scale: 4,
    nullable: true,
    transformer: numeric_transformer,
  })
  iva_rate!: number | null;

  @Column({
    type: 'boolean',
    default: true,
  })
  requires_cabys!: boolean;

  @Column({
    type: 'boolean',
    default: false,
  })
  allows_exoneration!: boolean;

  @Column({
    type: 'boolean',
    default: false,
  })
  has_specific_tax!: boolean;

  @Column({
    type: 'varchar',
    length: 160,
    nullable: true,
  })
  specific_tax_name!: string | null;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 4,
    nullable: true,
    transformer: numeric_transformer,
  })
  specific_tax_rate!: number | null;

  @Column({
    type: 'boolean',
    default: true,
  })
  is_active!: boolean;

  @OneToMany(() => Product, (product) => product.tax_profile)
  products?: Product[];
}
