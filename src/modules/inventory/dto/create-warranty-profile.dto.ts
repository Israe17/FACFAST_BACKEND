import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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

export class CreateWarrantyProfileDto {
  @ApiPropertyOptional({ example: 'WP-0001' })
  @IsOptional()
  @Matches(GENERIC_ENTITY_CODE_PATTERN)
  code?: string;

  @ApiProperty({ example: 'Garantia llanta premium' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty({ example: 12 })
  @IsInt()
  @Min(1)
  duration_value!: number;

  @ApiProperty({
    enum: WarrantyDurationUnit,
    example: WarrantyDurationUnit.MONTHS,
  })
  @IsEnum(WarrantyDurationUnit)
  duration_unit!: WarrantyDurationUnit;

  @ApiPropertyOptional({ example: 'Cobertura por defectos de fabrica' })
  @IsOptional()
  @IsString()
  coverage_notes?: string | null;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
