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
import { PromotionType } from '../enums/promotion-type.enum';
import { PromotionItem } from './promotion-item.entity';

@Entity('promotions')
@Index(['business_id', 'name'], { unique: true })
export class Promotion extends AuditedCodeEntity {
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
    enum: PromotionType,
  })
  type!: PromotionType;

  @Column({
    type: 'timestamptz',
  })
  valid_from!: Date;

  @Column({
    type: 'timestamptz',
  })
  valid_to!: Date;

  @Column({
    type: 'boolean',
    default: true,
  })
  is_active!: boolean;

  @OneToMany(() => PromotionItem, (promotion_item) => promotion_item.promotion)
  items?: PromotionItem[];
}
