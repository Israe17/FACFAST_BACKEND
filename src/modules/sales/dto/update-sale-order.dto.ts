import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { CreateSaleOrderDto } from './create-sale-order.dto';
import { CreateSaleOrderDeliveryChargeDto } from './create-sale-order-delivery-charge.dto';
import { CreateSaleOrderLineDto } from './create-sale-order-line.dto';
import { validation_messages } from '../../common/validation/validation-message.util';

export class UpdateSaleOrderDto extends PartialType(CreateSaleOrderDto) {
  @ApiPropertyOptional({
    type: [CreateSaleOrderLineDto],
    description:
      'If provided, replaces the full sale order lines collection. Omit to keep current lines.',
  })
  @IsOptional()
  @IsArray({ message: validation_messages.array_required() })
  @ArrayMinSize(1)
  @ValidateNested({
    each: true,
    message: validation_messages.invalid_nested_object(),
  })
  @Type(() => CreateSaleOrderLineDto)
  override lines?: CreateSaleOrderLineDto[];

  @ApiPropertyOptional({
    type: [CreateSaleOrderDeliveryChargeDto],
    description:
      'If provided, replaces the full delivery charges collection. Send [] to clear all charges.',
  })
  @IsOptional()
  @IsArray({ message: validation_messages.array_required() })
  @ValidateNested({
    each: true,
    message: validation_messages.invalid_nested_object(),
  })
  @Type(() => CreateSaleOrderDeliveryChargeDto)
  override delivery_charges?: CreateSaleOrderDeliveryChargeDto[];
}
