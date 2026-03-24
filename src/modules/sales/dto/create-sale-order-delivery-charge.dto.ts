import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { validation_messages } from '../../common/validation/validation-message.util';
import { DeliveryChargeType } from '../enums/delivery-charge-type.enum';

export class CreateSaleOrderDeliveryChargeDto {
  @ApiProperty({ enum: DeliveryChargeType })
  @IsEnum(DeliveryChargeType, { message: validation_messages.invalid_enum() })
  charge_type!: DeliveryChargeType;

  @ApiProperty()
  @IsNumber({}, { message: validation_messages.invalid_number() })
  @Min(0, { message: validation_messages.min_value() })
  amount!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: validation_messages.invalid_string() })
  notes?: string;
}
