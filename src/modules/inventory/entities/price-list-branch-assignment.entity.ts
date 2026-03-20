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
import { PriceList } from './price-list.entity';

@Entity('price_list_branch_assignments')
@Index(['business_id', 'price_list_id', 'branch_id'], { unique: true })
@Index(['business_id', 'branch_id'])
@Index(['business_id', 'price_list_id'])
export class PriceListBranchAssignment {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  business_id!: number;

  @ManyToOne(() => Business, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'business_id' })
  business?: Business;

  @Column({ type: 'int' })
  price_list_id!: number;

  @ManyToOne(() => PriceList, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'price_list_id' })
  price_list?: PriceList;

  @Column({ type: 'int' })
  branch_id!: number;

  @ManyToOne(() => Branch, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'branch_id' })
  branch?: Branch;

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @Column({ type: 'boolean', default: false })
  is_default!: boolean;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
