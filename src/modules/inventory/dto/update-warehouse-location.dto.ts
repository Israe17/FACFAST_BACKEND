import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { GENERIC_ENTITY_CODE_PATTERN } from '../../common/utils/validation-patterns.util';

export class UpdateWarehouseLocationDto {
  @ApiPropertyOptional({ example: 'WL-0002' })
  @IsOptional()
  @Matches(GENERIC_ENTITY_CODE_PATTERN)
  code?: string | null;

  @ApiPropertyOptional({ example: 'Recepcion Norte' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiPropertyOptional({ example: 'Ajuste de ubicacion', nullable: true })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ example: 'B', nullable: true })
  @IsOptional()
  @IsString()
  zone?: string | null;

  @ApiPropertyOptional({ example: '2', nullable: true })
  @IsOptional()
  @IsString()
  aisle?: string | null;

  @ApiPropertyOptional({ example: 'R4', nullable: true })
  @IsOptional()
  @IsString()
  rack?: string | null;

  @ApiPropertyOptional({ example: '1', nullable: true })
  @IsOptional()
  @IsString()
  level?: string | null;

  @ApiPropertyOptional({ example: 'P-01', nullable: true })
  @IsOptional()
  @IsString()
  position?: string | null;

  @ApiPropertyOptional({ example: 'BAR-LOC-1', nullable: true })
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
