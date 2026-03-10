import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { GENERIC_ENTITY_CODE_PATTERN } from '../../common/utils/validation-patterns.util';

export class CreateWarehouseLocationDto {
  @ApiPropertyOptional({ example: 'WL-0001' })
  @IsOptional()
  @Matches(GENERIC_ENTITY_CODE_PATTERN)
  code?: string;

  @ApiProperty({ example: 'Pasillo A - Rack 1' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiPropertyOptional({ example: 'Zona frontal de picking' })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ example: 'A' })
  @IsOptional()
  @IsString()
  zone?: string | null;

  @ApiPropertyOptional({ example: '1' })
  @IsOptional()
  @IsString()
  aisle?: string | null;

  @ApiPropertyOptional({ example: 'R1' })
  @IsOptional()
  @IsString()
  rack?: string | null;

  @ApiPropertyOptional({ example: '3' })
  @IsOptional()
  @IsString()
  level?: string | null;

  @ApiPropertyOptional({ example: 'P-05' })
  @IsOptional()
  @IsString()
  position?: string | null;

  @ApiPropertyOptional({ example: 'LOC-001' })
  @IsOptional()
  @IsString()
  barcode?: string | null;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_picking_area?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  is_receiving_area?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  is_dispatch_area?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
