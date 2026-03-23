import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { GENERIC_ENTITY_CODE_PATTERN } from '../../common/utils/validation-patterns.util';

export class UpdateRouteDto {
  @ApiPropertyOptional({ example: 'RT-0002' })
  @IsOptional()
  @Matches(GENERIC_ENTITY_CODE_PATTERN)
  code?: string | null;

  @ApiPropertyOptional({ example: 'Ruta Sur' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiPropertyOptional({ example: 'Ruta actualizada', nullable: true })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ example: 1, nullable: true })
  @IsOptional()
  @IsInt()
  zone_id?: number | null;

  @ApiPropertyOptional({ example: 1, nullable: true })
  @IsOptional()
  @IsInt()
  default_driver_user_id?: number | null;

  @ApiPropertyOptional({ example: 1, nullable: true })
  @IsOptional()
  @IsInt()
  default_vehicle_id?: number | null;

  @ApiPropertyOptional({ example: 20000.0, nullable: true })
  @IsOptional()
  @IsNumber()
  estimated_cost?: number | null;

  @ApiPropertyOptional({ example: 'Diaria', nullable: true })
  @IsOptional()
  @IsString()
  frequency?: string | null;

  @ApiPropertyOptional({ example: 'Martes', nullable: true })
  @IsOptional()
  @IsString()
  day_of_week?: string | null;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
