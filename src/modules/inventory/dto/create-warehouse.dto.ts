import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { GENERIC_ENTITY_CODE_PATTERN } from '../../common/utils/validation-patterns.util';
import { WarehousePurpose } from '../enums/warehouse-purpose.enum';

export class CreateWarehouseDto {
  @ApiPropertyOptional({ example: 'WH-0001' })
  @IsOptional()
  @Matches(GENERIC_ENTITY_CODE_PATTERN)
  code?: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  branch_id!: number;

  @ApiProperty({ example: 'Bodega Principal' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiPropertyOptional({ example: 'Bodega general de la sucursal' })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  uses_locations?: boolean;

  @ApiPropertyOptional({
    enum: WarehousePurpose,
    example: WarehousePurpose.GENERAL_STORAGE,
  })
  @IsOptional()
  @IsEnum(WarehousePurpose)
  purpose?: WarehousePurpose;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  is_default?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({ example: 9.9280694 })
  @IsOptional()
  @IsNumber()
  latitude?: number | null;

  @ApiPropertyOptional({ example: -84.0907246 })
  @IsOptional()
  @IsNumber()
  longitude?: number | null;
}
