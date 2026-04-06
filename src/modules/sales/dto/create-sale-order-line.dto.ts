import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { validation_messages } from '../../common/validation/validation-message.util';

export class CreateSaleOrderLineDto {
  @ApiProperty()
  @IsInt({ message: validation_messages.invalid_number() })
  @IsPositive({ message: validation_messages.positive_number() })
  product_variant_id!: number;

  @ApiProperty()
  @IsNumber({}, { message: validation_messages.invalid_number() })
  @IsPositive({ message: validation_messages.positive_number() })
  quantity!: number;

  @ApiProperty()
  @IsNumber({}, { message: validation_messages.invalid_number() })
  @Min(0, { message: validation_messages.min_value() })
  unit_price!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber({}, { message: validation_messages.invalid_number() })
  @Min(0, { message: validation_messages.min_value() })
  @Max(100, { message: validation_messages.max_value() })
  discount_percent?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber({}, { message: validation_messages.invalid_number() })
  @Min(0, { message: validation_messages.min_value() })
  tax_amount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber({}, { message: validation_messages.invalid_number() })
  @Min(0, { message: validation_messages.min_value() })
  line_total?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: validation_messages.invalid_string() })
  notes?: string;
}
