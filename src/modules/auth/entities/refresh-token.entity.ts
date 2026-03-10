import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { Business } from '../../common/entities/business.entity';
import { CreatedCodeEntity } from '../../common/entities/created-code.entity';
import { User } from '../../users/entities/user.entity';

@Entity('refresh_tokens')
export class RefreshToken extends CreatedCodeEntity {
  @Column({
    type: 'int',
  })
  user_id!: number;

  @ManyToOne(() => User, (user) => user.refresh_tokens, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'user_id',
  })
  user?: User;

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
    length: 255,
    select: false,
  })
  token_hash!: string;

  @Column({
    type: 'timestamptz',
  })
  expires_at!: Date;

  @Column({
    type: 'timestamptz',
    nullable: true,
  })
  revoked_at!: Date | null;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  user_agent!: string | null;

  @Column({
    type: 'varchar',
    length: 64,
    nullable: true,
  })
  ip_address!: string | null;
}
