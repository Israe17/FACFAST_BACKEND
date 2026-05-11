import { Entity, JoinColumn, ManyToOne, PrimaryColumn, Unique } from 'typeorm';
import { Permission } from '../../rbac/entities/permission.entity';
import { User } from './user.entity';

@Entity('user_permissions')
@Unique(['user_id', 'permission_id'])
export class UserPermission {
  @PrimaryColumn({
    type: 'int',
  })
  user_id!: number;

  @PrimaryColumn({
    type: 'int',
  })
  permission_id!: number;

  @ManyToOne(() => User, (user) => user.user_permissions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'user_id',
  })
  user?: User;

  @ManyToOne(() => Permission, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'permission_id',
  })
  permission?: Permission;
}
