import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AuditedCodeEntity } from './audited-code.entity';
import { IdentificationType } from '../enums/identification-type.enum';
import { Canton } from '../../regions/entities/canton.entity';
import { Country } from '../../regions/entities/country.entity';
import { District } from '../../regions/entities/district.entity';
import { Province } from '../../regions/entities/province.entity';

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

  @Column({ type: 'int', nullable: true })
  country_id!: number | null;

  @ManyToOne(() => Country, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'country_id' })
  country_ref?: Country | null;

  @Column({ type: 'int', nullable: true })
  province_id!: number | null;

  @ManyToOne(() => Province, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'province_id' })
  province_ref?: Province | null;

  @Column({ type: 'int', nullable: true })
  canton_id!: number | null;

  @ManyToOne(() => Canton, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'canton_id' })
  canton_ref?: Canton | null;

  @Column({ type: 'int', nullable: true })
  district_id!: number | null;

  @ManyToOne(() => District, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'district_id' })
  district_ref?: District | null;

  @Column({
    type: 'boolean',
    default: true,
  })
  is_active!: boolean;
}
