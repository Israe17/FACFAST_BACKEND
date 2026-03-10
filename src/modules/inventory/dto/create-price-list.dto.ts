import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { GENERIC_ENTITY_CODE_PATTERN } from '../../common/utils/validation-patterns.util';
import { PriceListKind } from '../enums/price-list-kind.enum';

export class CreatePriceListDto {
  @ApiPropertyOptional({ example: 'PL-0001' })
  @IsOptional()
  @Matches(GENERIC_ENTITY_CODE_PATTERN)
  code?: string;

  @ApiProperty({ example: 'Precio Retail' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty({ enum: PriceListKind, example: PriceListKind.RETAIL })
  @IsEnum(PriceListKind)
  kind!: PriceListKind;

  @ApiProperty({ example: 'CRC' })
  @IsString()
  @Matches(/^[A-Z]{3}$/)
  currency!: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  is_default?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
