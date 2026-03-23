import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { GENERIC_ENTITY_CODE_PATTERN } from '../../common/utils/validation-patterns.util';

export class UpdateVehicleDto {
  @ApiPropertyOptional({ example: 'VH-0002' })
  @IsOptional()
  @Matches(GENERIC_ENTITY_CODE_PATTERN)
  code?: string | null;

  @ApiPropertyOptional({ example: 'XYZ-5678' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  plate_number?: string;

  @ApiPropertyOptional({ example: 'Camión de reparto #2' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiPropertyOptional({ example: 'Furgoneta', nullable: true })
  @IsOptional()
  @IsString()
  vehicle_type?: string | null;

  @ApiPropertyOptional({ example: 3000.0, nullable: true })
  @IsOptional()
  @IsNumber()
  max_weight_kg?: number | null;

  @ApiPropertyOptional({ example: 15.0, nullable: true })
  @IsOptional()
  @IsNumber()
  max_volume_m3?: number | null;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({ example: 'Notas actualizadas', nullable: true })
  @IsOptional()
  @IsString()
  notes?: string | null;
}
