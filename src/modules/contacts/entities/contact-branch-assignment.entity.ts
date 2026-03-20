import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Branch } from '../../branches/entities/branch.entity';
import { Business } from '../../common/entities/business.entity';
import { PriceList } from '../../inventory/entities/price-list.entity';
import { User } from '../../users/entities/user.entity';
import { numeric_transformer } from '../../common/utils/numeric.transformer';
import { Contact } from './contact.entity';

@Entity('contact_branch_assignments')
@Index(['business_id', 'contact_id', 'branch_id'], { unique: true })
@Index(['business_id', 'branch_id'])
@Index(['business_id', 'contact_id'])
export class ContactBranchAssignment {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  business_id!: number;

  @ManyToOne(() => Business, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'business_id' })
  business?: Business;

  @Column({ type: 'int' })
  contact_id!: number;

  @ManyToOne(() => Contact, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contact_id' })
  contact?: Contact;

  @Column({ type: 'int' })
  branch_id!: number;

  @ManyToOne(() => Branch, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'branch_id' })
  branch?: Branch;

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @Column({ type: 'boolean', default: false })
  is_default!: boolean;

  @Column({ type: 'boolean', default: false })
  is_preferred!: boolean;

  @Column({ type: 'boolean', default: false })
  is_exclusive!: boolean;

  @Column({ type: 'boolean', default: true })
  sales_enabled!: boolean;

  @Column({ type: 'boolean', default: true })
  purchases_enabled!: boolean;

  @Column({ type: 'boolean', default: false })
  credit_enabled!: boolean;

  @Column({
    type: 'numeric',
    precision: 14,
    scale: 4,
    nullable: true,
    transformer: numeric_transformer,
  })
  custom_credit_limit!: number | null;

  @Column({ type: 'int', nullable: true })
  custom_price_list_id!: number | null;

  @ManyToOne(() => PriceList, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'custom_price_list_id' })
  custom_price_list?: PriceList | null;

  @Column({ type: 'int', nullable: true })
  account_manager_user_id!: number | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'account_manager_user_id' })
  account_manager_user?: User | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
