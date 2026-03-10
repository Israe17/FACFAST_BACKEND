import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { GENERIC_ENTITY_CODE_PATTERN } from '../../common/utils/validation-patterns.util';

export class CreateMeasurementUnitDto {
  @ApiPropertyOptional({ example: 'MU-0001' })
  @IsOptional()
  @Matches(GENERIC_ENTITY_CODE_PATTERN)
  code?: string;

  @ApiProperty({ example: 'Kilogramo' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty({ example: 'kg' })
  @IsString()
  @MinLength(1)
  symbol!: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
