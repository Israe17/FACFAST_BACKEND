import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { RefreshToken } from '../../auth/entities/refresh-token.entity';
import { Business } from '../../common/entities/business.entity';
import { AuditedCodeEntity } from '../../common/entities/audited-code.entity';
import { UserStatus } from '../../common/enums/user-status.enum';
import { UserType } from '../../common/enums/user-type.enum';
import { numeric_transformer } from '../../common/utils/numeric.transformer';
import { UserBranchAccess } from './user-branch-access.entity';
import { UserRole } from './user-role.entity';

@Entity('users')
@Index(['email'], { unique: true })
@Index(['business_id', 'code'], { unique: true })
export class User extends AuditedCodeEntity {
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
    type: 'varchar',
    length: 160,
  })
  email!: string;

  @Column({
    type: 'varchar',
    length: 255,
    select: false,
  })
  password_hash!: string;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status!: UserStatus;

  @Column({
    type: 'boolean',
    default: true,
  })
  allow_login!: boolean;

  @Column({
    type: 'enum',
    enum: UserType,
    default: UserType.STAFF,
  })
  user_type!: UserType;

  @Column({
    type: 'boolean',
    default: false,
  })
  is_platform_admin!: boolean;

  @Column({
    type: 'numeric',
    precision: 5,
    scale: 2,
    default: 0,
    transformer: numeric_transformer,
  })
  max_sale_discount!: number;

  @Column({
    type: 'timestamptz',
    nullable: true,
  })
  last_login_at!: Date | null;

  @OneToMany(() => UserRole, (user_role) => user_role.user)
  user_roles?: UserRole[];

  @OneToMany(
    () => UserBranchAccess,
    (user_branch_access) => user_branch_access.user,
  )
  user_branch_access?: UserBranchAccess[];

  @OneToMany(() => RefreshToken, (refresh_token) => refresh_token.user)
  refresh_tokens?: RefreshToken[];
}
