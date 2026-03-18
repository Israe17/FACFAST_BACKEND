import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Business } from '../../common/entities/business.entity';
import { VariantAttribute } from './variant-attribute.entity';

@Entity('variant_attribute_values')
@Index(['attribute_id', 'value'], { unique: true })
export class VariantAttributeValue {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  business_id!: number;

  @ManyToOne(() => Business, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'business_id' })
  business?: Business;

  @Column({ type: 'int' })
  attribute_id!: number;

  @ManyToOne(() => VariantAttribute, (attribute) => attribute.values, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'attribute_id' })
  attribute?: VariantAttribute;

  @Column({ type: 'varchar', length: 100 })
  value!: string;

  @Column({ type: 'int', default: 0 })
  display_order!: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;
}
