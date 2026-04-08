import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { GENERIC_ENTITY_CODE_PATTERN } from '../../common/utils/validation-patterns.util';

export class CreateZoneDto {
  @ApiPropertyOptional({ example: 'ZN-0001' })
  @IsOptional()
  @Matches(GENERIC_ENTITY_CODE_PATTERN)
  code?: string;

  @ApiProperty({ example: 'Santa Cruz Norte' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiPropertyOptional({ example: 'Zona norte de Santa Cruz' })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ example: 'Guanacaste' })
  @IsOptional()
  @IsString()
  province?: string | null;

  @ApiPropertyOptional({ example: 'Santa Cruz' })
  @IsOptional()
  @IsString()
  canton?: string | null;

  @ApiPropertyOptional({ example: 'Bolsón' })
  @IsOptional()
  @IsString()
  district?: string | null;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_global?: boolean;

  @ApiPropertyOptional({ example: [[10.0, -84.0], [10.1, -84.1], [10.0, -84.1]] })
  @IsOptional()
  @IsArray()
  boundary?: [number, number][] | null;

  @ApiPropertyOptional({ example: [1, 2] })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  assigned_branch_ids?: number[];
}
