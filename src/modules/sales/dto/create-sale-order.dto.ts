import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator';
import { GENERIC_ENTITY_CODE_PATTERN } from '../../common/utils/validation-patterns.util';
import { validation_messages } from '../../common/validation/validation-message.util';
import { FulfillmentMode } from '../enums/fulfillment-mode.enum';
import { SaleMode } from '../enums/sale-mode.enum';
import { CreateSaleOrderDeliveryChargeDto } from './create-sale-order-delivery-charge.dto';
import { CreateSaleOrderLineDto } from './create-sale-order-line.dto';

export class CreateSaleOrderDto {
  @ApiPropertyOptional({ example: 'SO-0001' })
  @IsOptional()
  @Matches(GENERIC_ENTITY_CODE_PATTERN, {
    message: validation_messages.pattern_mismatch(),
  })
  code?: string;

  @ApiProperty()
  @IsInt({ message: validation_messages.invalid_number() })
  @IsPositive({ message: validation_messages.positive_number() })
  branch_id!: number;

  @ApiProperty()
  @IsInt({ message: validation_messages.invalid_number() })
  @IsPositive({ message: validation_messages.positive_number() })
  customer_contact_id!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt({ message: validation_messages.invalid_number() })
  @IsPositive({ message: validation_messages.positive_number() })
  seller_user_id?: number;

  @ApiProperty({ enum: SaleMode })
  @IsEnum(SaleMode, { message: validation_messages.invalid_enum() })
  sale_mode!: SaleMode;

  @ApiProperty({ enum: FulfillmentMode })
  @IsEnum(FulfillmentMode, { message: validation_messages.invalid_enum() })
  fulfillment_mode!: FulfillmentMode;

  @ApiProperty()
  @IsDateString({}, { message: validation_messages.invalid_date() })
  order_date!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: validation_messages.invalid_string() })
  delivery_address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: validation_messages.invalid_string() })
  delivery_province?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: validation_messages.invalid_string() })
  delivery_canton?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: validation_messages.invalid_string() })
  delivery_district?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt({ message: validation_messages.invalid_number() })
  @IsPositive({ message: validation_messages.positive_number() })
  delivery_zone_id?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString({}, { message: validation_messages.invalid_date() })
  delivery_requested_date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt({ message: validation_messages.invalid_number() })
  @IsPositive({ message: validation_messages.positive_number() })
  warehouse_id?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: validation_messages.invalid_string() })
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: validation_messages.invalid_string() })
  internal_notes?: string;

  @ApiProperty({
    type: [CreateSaleOrderLineDto],
    description:
      'Full line collection for the sale order. At least one line is required.',
  })
  @IsArray({ message: validation_messages.array_required() })
  @ArrayMinSize(1)
  @ValidateNested({ each: true, message: validation_messages.invalid_nested_object() })
  @Type(() => CreateSaleOrderLineDto)
  lines!: CreateSaleOrderLineDto[];

  @ApiPropertyOptional({
    type: [CreateSaleOrderDeliveryChargeDto],
    description:
      'Optional full delivery charges collection. Send [] to persist no delivery charges.',
  })
  @IsOptional()
  @IsArray({ message: validation_messages.array_required() })
  @ValidateNested({ each: true, message: validation_messages.invalid_nested_object() })
  @Type(() => CreateSaleOrderDeliveryChargeDto)
  delivery_charges?: CreateSaleOrderDeliveryChargeDto[];
}
