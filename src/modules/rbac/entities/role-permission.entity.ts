import { Entity, JoinColumn, ManyToOne, PrimaryColumn, Unique } from 'typeorm';
import { Permission } from './permission.entity';
import { Role } from './role.entity';

@Entity('role_permissions')
@Unique(['role_id', 'permission_id'])
export class RolePermission {
  @PrimaryColumn({
    type: 'int',
  })
  role_id!: number;

  @PrimaryColumn({
    type: 'int',
  })
  permission_id!: number;

  @ManyToOne(() => Role, (role) => role.role_permissions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'role_id',
  })
  role?: Role;

  @ManyToOne(() => Permission, (permission) => permission.role_permissions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'permission_id',
  })
  permission?: Permission;
}
