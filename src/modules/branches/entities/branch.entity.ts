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
import { numeric_transformer } from '../../common/utils/numeric.transformer';
import { IdentificationType } from '../../common/enums/identification-type.enum';
import { UserBranchAccess } from '../../users/entities/user-branch-access.entity';
import { Terminal } from './terminal.entity';

@Entity('branches')
@Index(['business_id', 'branch_number'], { unique: true })
@Index(['business_id', 'code'], { unique: true })
export class Branch extends AuditedCodeEntity {
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
  business_name!: string;

  @Column({
    type: 'varchar',
    length: 160,
    nullable: true,
  })
  name!: string | null;

  @Column({
    type: 'varchar',
    length: 160,
  })
  legal_name!: string;

  @Column({
    type: 'enum',
    enum: IdentificationType,
    nullable: true,
  })
  identification_type!: IdentificationType | null;

  @Column({
    type: 'varchar',
    length: 40,
    nullable: true,
  })
  identification_number!: string | null;

  @Column({
    type: 'varchar',
    length: 20,
  })
  cedula_juridica!: string;

  @Column({
    type: 'varchar',
    length: 3,
  })
  branch_number!: string;

  @Column({
    type: 'varchar',
    length: 255,
  })
  address!: string;

  @Column({
    type: 'varchar',
    length: 120,
  })
  province!: string;

  @Column({
    type: 'varchar',
    length: 120,
  })
  canton!: string;

  @Column({
    type: 'varchar',
    length: 120,
  })
  district!: string;

  @Column({
    type: 'varchar',
    length: 120,
    nullable: true,
  })
  city!: string | null;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  phone!: string | null;

  @Column({
    type: 'varchar',
    length: 160,
    nullable: true,
  })
  email!: string | null;

  @Column({
    type: 'varchar',
    length: 80,
    nullable: true,
  })
  activity_code!: string | null;

  @Column({
    type: 'varchar',
    length: 80,
    nullable: true,
  })
  provider_code!: string | null;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  cert_path!: string | null;

  @Column({
    type: 'text',
    nullable: true,
  })
  crypto_key_encrypted!: string | null;

  @Column({
    type: 'varchar',
    length: 160,
    nullable: true,
  })
  hacienda_username!: string | null;

  @Column({
    type: 'text',
    nullable: true,
  })
  hacienda_password_encrypted!: string | null;

  @Column({
    type: 'text',
    nullable: true,
  })
  mail_key_encrypted!: string | null;

  @Column({
    type: 'varchar',
    length: 80,
    nullable: true,
  })
  signature_type!: string | null;

  @Column({
    type: 'boolean',
    default: true,
  })
  is_active!: boolean;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 7,
    nullable: true,
    transformer: numeric_transformer,
  })
  latitude!: number | null;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 7,
    nullable: true,
    transformer: numeric_transformer,
  })
  longitude!: number | null;

  @OneToMany(() => Terminal, (terminal) => terminal.branch)
  terminals?: Terminal[];

  @OneToMany(
    () => UserBranchAccess,
    (user_branch_access) => user_branch_access.branch,
  )
  user_branch_access?: UserBranchAccess[];
}
