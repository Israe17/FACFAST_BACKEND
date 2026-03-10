import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Min,
  MinLength,
} from 'class-validator';
import { GENERIC_ENTITY_CODE_PATTERN } from '../../common/utils/validation-patterns.util';
import { WarrantyDurationUnit } from '../enums/warranty-duration-unit.enum';

export class UpdateWarrantyProfileDto {
  @ApiPropertyOptional({ example: 'WP-0002' })
  @IsOptional()
  @Matches(GENERIC_ENTITY_CODE_PATTERN)
  code?: string | null;

  @ApiPropertyOptional({ example: 'Garantia ajustada' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiPropertyOptional({ example: 24 })
  @IsOptional()
  @IsInt()
  @Min(1)
  duration_value?: number;

  @ApiPropertyOptional({ enum: WarrantyDurationUnit })
  @IsOptional()
  @IsEnum(WarrantyDurationUnit)
  duration_unit?: WarrantyDurationUnit;

  @ApiPropertyOptional({ example: 'Cobertura extendida', nullable: true })
  @IsOptional()
  @IsString()
  coverage_notes?: string | null;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
