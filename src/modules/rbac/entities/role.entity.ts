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
import { UserRole } from '../../users/entities/user-role.entity';
import { RolePermission } from './role-permission.entity';

@Entity('roles')
@Index(['business_id', 'role_key'], { unique: true })
export class Role extends AuditedCodeEntity {
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
    length: 120,
  })
  name!: string;

  @Column({
    type: 'varchar',
    length: 80,
  })
  role_key!: string;

  @Column({
    type: 'boolean',
    default: false,
  })
  is_system!: boolean;

  @OneToMany(() => RolePermission, (role_permission) => role_permission.role)
  role_permissions?: RolePermission[];

  @OneToMany(() => UserRole, (user_role) => user_role.role)
  user_roles?: UserRole[];
}
