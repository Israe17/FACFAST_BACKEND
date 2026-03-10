import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { Business } from '../../common/entities/business.entity';
import { AuditedCodeEntity } from '../../common/entities/audited-code.entity';
import { numeric_transformer } from '../../common/utils/numeric.transformer';
import { ContactIdentificationType } from '../enums/contact-identification-type.enum';
import { ContactType } from '../enums/contact-type.enum';

@Entity('contacts')
@Index(['business_id', 'identification_type', 'identification_number'], {
  unique: true,
})
export class Contact extends AuditedCodeEntity {
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
    type: 'enum',
    enum: ContactType,
  })
  type!: ContactType;

  @Column({
    type: 'varchar',
    length: 160,
  })
  name!: string;

  @Column({
    type: 'varchar',
    length: 160,
    nullable: true,
  })
  commercial_name!: string | null;

  @Column({
    type: 'enum',
    enum: ContactIdentificationType,
  })
  identification_type!: ContactIdentificationType;

  @Column({
    type: 'varchar',
    length: 40,
  })
  identification_number!: string;

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
  address!: string | null;

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
    length: 80,
    nullable: true,
  })
  tax_condition!: string | null;

  @Column({
    type: 'varchar',
    length: 80,
    nullable: true,
  })
  economic_activity_code!: string | null;

  @Column({
    type: 'boolean',
    default: true,
  })
  is_active!: boolean;

  @Column({
    type: 'varchar',
    length: 80,
    nullable: true,
  })
  exoneration_type!: string | null;

  @Column({
    type: 'varchar',
    length: 80,
    nullable: true,
  })
  exoneration_document_number!: string | null;

  @Column({
    type: 'varchar',
    length: 160,
    nullable: true,
  })
  exoneration_institution!: string | null;

  @Column({
    type: 'date',
    nullable: true,
  })
  exoneration_issue_date!: string | null;

  @Column({
    type: 'numeric',
    precision: 5,
    scale: 2,
    nullable: true,
    transformer: numeric_transformer,
  })
  exoneration_percentage!: number | null;
}
