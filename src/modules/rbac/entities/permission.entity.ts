import { Column, Entity, OneToMany } from 'typeorm';
import { BaseCodeEntity } from '../../common/entities/base-code.entity';
import { RolePermission } from './role-permission.entity';

@Entity('permissions')
export class Permission extends BaseCodeEntity {
  @Column({
    type: 'varchar',
    length: 120,
    unique: true,
  })
  key!: string;

  @Column({
    type: 'varchar',
    length: 80,
  })
  module!: string;

  @Column({
    type: 'varchar',
    length: 80,
  })
  action!: string;

  @Column({
    type: 'varchar',
    length: 255,
  })
  description!: string;

  @OneToMany(
    () => RolePermission,
    (role_permission) => role_permission.permission,
  )
  role_permissions?: RolePermission[];
}
