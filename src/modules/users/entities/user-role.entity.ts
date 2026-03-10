import { Entity, JoinColumn, ManyToOne, PrimaryColumn, Unique } from 'typeorm';
import { Role } from '../../rbac/entities/role.entity';
import { User } from './user.entity';

@Entity('user_roles')
@Unique(['user_id', 'role_id'])
export class UserRole {
  @PrimaryColumn({
    type: 'int',
  })
  user_id!: number;

  @PrimaryColumn({
    type: 'int',
  })
  role_id!: number;

  @ManyToOne(() => User, (user) => user.user_roles, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'user_id',
  })
  user?: User;

  @ManyToOne(() => Role, (role) => role.user_roles, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'role_id',
  })
  role?: Role;
}
