import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { GENERIC_ENTITY_CODE_PATTERN } from '../../common/utils/validation-patterns.util';

export class UpdateMeasurementUnitDto {
  @ApiPropertyOptional({ example: 'MU-0002' })
  @IsOptional()
  @Matches(GENERIC_ENTITY_CODE_PATTERN)
  code?: string | null;

  @ApiPropertyOptional({ example: 'Servicio' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiPropertyOptional({ example: 'srv' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  symbol?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
