import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  ValidateNested,
} from 'class-validator';
import { FulfillmentMode } from '../enums/fulfillment-mode.enum';
import { SaleMode } from '../enums/sale-mode.enum';
import { CreateSaleOrderDeliveryChargeDto } from './create-sale-order-delivery-charge.dto';
import { CreateSaleOrderLineDto } from './create-sale-order-line.dto';

export class CreateSaleOrderDto {
  @ApiProperty()
  @IsInt()
  @IsPositive()
  branch_id!: number;

  @ApiProperty()
  @IsInt()
  @IsPositive()
  customer_contact_id!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @IsPositive()
  seller_user_id?: number;

  @ApiProperty({ enum: SaleMode })
  @IsEnum(SaleMode)
  sale_mode!: SaleMode;

  @ApiProperty({ enum: FulfillmentMode })
  @IsEnum(FulfillmentMode)
  fulfillment_mode!: FulfillmentMode;

  @ApiProperty()
  @IsDateString()
  order_date!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  delivery_address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  delivery_province?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  delivery_canton?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  delivery_district?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @IsPositive()
  delivery_zone_id?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  delivery_requested_date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @IsPositive()
  warehouse_id?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  internal_notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({ type: [CreateSaleOrderLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSaleOrderLineDto)
  lines!: CreateSaleOrderLineDto[];

  @ApiPropertyOptional({ type: [CreateSaleOrderDeliveryChargeDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSaleOrderDeliveryChargeDto)
  delivery_charges?: CreateSaleOrderDeliveryChargeDto[];
}
