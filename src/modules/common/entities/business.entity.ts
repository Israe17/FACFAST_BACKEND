import { Column, Entity } from 'typeorm';
import { AuditedCodeEntity } from './audited-code.entity';
import { IdentificationType } from '../enums/identification-type.enum';

@Entity('businesses')
export class Business extends AuditedCodeEntity {
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
    length: 3,
    default: 'CRC',
  })
  currency_code!: string;

  @Column({
    type: 'varchar',
    length: 80,
    default: 'America/Costa_Rica',
  })
  timezone!: string;

  @Column({
    type: 'varchar',
    length: 16,
    default: 'es-CR',
  })
  language!: string;

  @Column({
    type: 'varchar',
    length: 160,
  })
  name!: string;

  @Column({
    type: 'varchar',
    length: 160,
  })
  legal_name!: string;

  @Column({
    type: 'varchar',
    length: 160,
    nullable: true,
  })
  email!: string | null;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  phone!: string | null;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  website!: string | null;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  logo_url!: string | null;

  @Column({
    type: 'varchar',
    length: 120,
    nullable: true,
  })
  country!: string | null;

  @Column({
    type: 'varchar',
    length: 120,
    nullable: true,
  })
  province!: string | null;

  @Column({
    type: 'varchar',
    length: 120,
    nullable: true,
  })
  canton!: string | null;

  @Column({
    type: 'varchar',
    length: 120,
    nullable: true,
  })
  district!: string | null;

  @Column({
    type: 'varchar',
    length: 120,
    nullable: true,
  })
  city!: string | null;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  address!: string | null;

  @Column({
    type: 'varchar',
    length: 40,
    nullable: true,
  })
  postal_code!: string | null;

  @Column({
    type: 'boolean',
    default: true,
  })
  is_active!: boolean;
}
