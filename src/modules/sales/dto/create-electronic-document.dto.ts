import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { ElectronicDocumentType } from '../enums/electronic-document-type.enum';

export class CreateElectronicDocumentDto {
  @ApiProperty()
  @IsInt()
  @IsPositive()
  sale_order_id!: number;

  @ApiProperty({ enum: ElectronicDocumentType })
  @IsEnum(ElectronicDocumentType)
  document_type!: ElectronicDocumentType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  receiver_name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  receiver_identification_type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  receiver_identification_number?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  receiver_email?: string;
}
