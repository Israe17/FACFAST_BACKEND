import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { Branch } from '../../branches/entities/branch.entity';
import { Business } from '../../common/entities/business.entity';
import { AuditedCodeEntity } from '../../common/entities/audited-code.entity';
import { numeric_transformer } from '../../common/utils/numeric.transformer';
import { ElectronicDocumentType } from '../enums/electronic-document-type.enum';
import { HaciendaStatus } from '../enums/hacienda-status.enum';
import { SaleOrder } from './sale-order.entity';

@Entity('electronic_documents')
@Index(['business_id', 'document_key'], {
  unique: true,
  where: '"document_key" IS NOT NULL',
})
@Index(['business_id', 'sale_order_id'])
@Index(['business_id', 'hacienda_status'])
export class ElectronicDocument extends AuditedCodeEntity {
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
    type: 'int',
  })
  branch_id!: number;

  @ManyToOne(() => Branch, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'branch_id',
  })
  branch?: Branch;

  @Column({
    type: 'int',
    nullable: true,
  })
  sale_order_id!: number | null;

  @ManyToOne(() => SaleOrder, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({
    name: 'sale_order_id',
  })
  sale_order?: SaleOrder | null;

  @Column({
    type: 'varchar',
    length: 40,
  })
  document_type!: ElectronicDocumentType;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  document_key!: string | null;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  consecutive!: string | null;

  @Column({
    type: 'timestamptz',
  })
  emission_date!: Date;

  @Column({
    type: 'varchar',
    length: 3,
    default: 'CRC',
  })
  currency!: string;

  @Column({
    type: 'numeric',
    precision: 14,
    scale: 2,
    transformer: numeric_transformer,
  })
  subtotal!: number;

  @Column({
    type: 'numeric',
    precision: 14,
    scale: 2,
    transformer: numeric_transformer,
  })
  tax_total!: number;

  @Column({
    type: 'numeric',
    precision: 14,
    scale: 2,
    default: 0,
    transformer: numeric_transformer,
  })
  discount_total!: number;

  @Column({
    type: 'numeric',
    precision: 14,
    scale: 2,
    transformer: numeric_transformer,
  })
  total!: number;

  @Column({
    type: 'varchar',
    length: 160,
  })
  receiver_name!: string;

  @Column({
    type: 'varchar',
    length: 10,
    nullable: true,
  })
  receiver_identification_type!: string | null;

  @Column({
    type: 'varchar',
    length: 40,
    nullable: true,
  })
  receiver_identification_number!: string | null;

  @Column({
    type: 'varchar',
    length: 160,
    nullable: true,
  })
  receiver_email!: string | null;

  @Column({
    type: 'varchar',
    length: 30,
    default: HaciendaStatus.PENDING,
  })
  hacienda_status!: HaciendaStatus;

  @Column({
    type: 'text',
    nullable: true,
  })
  hacienda_response_xml!: string | null;

  @Column({
    type: 'text',
    nullable: true,
  })
  hacienda_message!: string | null;

  @Column({
    type: 'timestamptz',
    nullable: true,
  })
  submitted_at!: Date | null;

  @Column({
    type: 'timestamptz',
    nullable: true,
  })
  accepted_at!: Date | null;

  @Column({
    type: 'text',
    nullable: true,
  })
  xml_content!: string | null;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  pdf_path!: string | null;
}
