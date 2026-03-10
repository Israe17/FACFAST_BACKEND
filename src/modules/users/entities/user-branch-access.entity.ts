import { Entity, JoinColumn, ManyToOne, PrimaryColumn, Unique } from 'typeorm';
import { Branch } from '../../branches/entities/branch.entity';
import { User } from './user.entity';

@Entity('user_branch_access')
@Unique(['user_id', 'branch_id'])
export class UserBranchAccess {
  @PrimaryColumn({
    type: 'int',
  })
  user_id!: number;

  @PrimaryColumn({
    type: 'int',
  })
  branch_id!: number;

  @ManyToOne(() => User, (user) => user.user_branch_access, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'user_id',
  })
  user?: User;

  @ManyToOne(() => Branch, (branch) => branch.user_branch_access, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'branch_id',
  })
  branch?: Branch;
}
