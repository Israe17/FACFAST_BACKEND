import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { DeliveryChargeType } from '../enums/delivery-charge-type.enum';

export class CreateSaleOrderDeliveryChargeDto {
  @ApiProperty({ enum: DeliveryChargeType })
  @IsEnum(DeliveryChargeType)
  charge_type!: DeliveryChargeType;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  amount!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
