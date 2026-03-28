import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { GENERIC_ENTITY_CODE_PATTERN } from '../../common/utils/validation-patterns.util';
import { PromotionType } from '../enums/promotion-type.enum';
import { CreatePromotionItemDto } from './create-promotion-item.dto';

export class CreatePromotionDto {
  @ApiPropertyOptional({ example: 'PN-0001' })
  @IsOptional()
  @Matches(GENERIC_ENTITY_CODE_PATTERN)
  code?: string;

  @ApiProperty({ example: 'Promo 3x2 Bebidas' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty({ enum: PromotionType, example: PromotionType.BUY_X_GET_Y })
  @IsEnum(PromotionType)
  type!: PromotionType;

  @ApiProperty({ example: '2026-03-10T00:00:00.000Z' })
  @IsDateString()
  valid_from!: string;

  @ApiProperty({ example: '2026-03-31T23:59:59.000Z' })
  @IsDateString()
  valid_to!: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiProperty({
    type: [CreatePromotionItemDto],
    description:
      'Full promotion items collection. At least one item is required.',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreatePromotionItemDto)
  items!: CreatePromotionItemDto[];
}
