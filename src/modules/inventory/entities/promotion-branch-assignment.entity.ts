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
import { Promotion } from './promotion.entity';

@Entity('promotion_branch_assignments')
@Index(['business_id', 'promotion_id', 'branch_id'], { unique: true })
@Index(['business_id', 'branch_id'])
@Index(['business_id', 'promotion_id'])
export class PromotionBranchAssignment {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  business_id!: number;

  @ManyToOne(() => Business, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'business_id' })
  business?: Business;

  @Column({ type: 'int' })
  promotion_id!: number;

  @ManyToOne(() => Promotion, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'promotion_id' })
  promotion?: Promotion;

  @Column({ type: 'int' })
  branch_id!: number;

  @ManyToOne(() => Branch, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'branch_id' })
  branch?: Branch;

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
