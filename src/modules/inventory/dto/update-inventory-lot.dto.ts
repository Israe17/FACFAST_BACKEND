import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Min,
  MinLength,
} from 'class-validator';
import { GENERIC_ENTITY_CODE_PATTERN } from '../../common/utils/validation-patterns.util';

export class UpdateInventoryLotDto {
  @ApiPropertyOptional({ example: 'LT-0002' })
  @IsOptional()
  @Matches(GENERIC_ENTITY_CODE_PATTERN)
  code?: string | null;

  @ApiPropertyOptional({ example: 2, nullable: true })
  @IsOptional()
  @IsInt()
  location_id?: number | null;

  @ApiPropertyOptional({ example: 'L-2026-0002' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  lot_number?: string;

  @ApiPropertyOptional({ example: '2026-12-31', nullable: true })
  @IsOptional()
  @IsDateString()
  expiration_date?: string | null;

  @ApiPropertyOptional({ example: '2026-01-10', nullable: true })
  @IsOptional()
  @IsDateString()
  manufacturing_date?: string | null;

  @ApiPropertyOptional({
    example: '2026-03-10T15:00:00.000Z',
    nullable: true,
  })
  @IsOptional()
  @IsDateString()
  received_at?: string | null;

  @ApiPropertyOptional({ example: 3600, nullable: true })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  unit_cost?: number | null;

  @ApiPropertyOptional({ example: 4, nullable: true })
  @IsOptional()
  @IsInt()
  supplier_contact_id?: number | null;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
