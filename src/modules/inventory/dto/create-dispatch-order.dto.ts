import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { GENERIC_ENTITY_CODE_PATTERN } from '../../common/utils/validation-patterns.util';
import { DispatchType } from '../enums/dispatch-type.enum';

export class CreateDispatchOrderDto {
  @ApiPropertyOptional({ example: 'DO-0001' })
  @IsOptional()
  @Matches(GENERIC_ENTITY_CODE_PATTERN)
  code?: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  branch_id!: number;

  @ApiProperty({ example: 'individual', enum: DispatchType })
  @IsEnum(DispatchType)
  dispatch_type!: DispatchType;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  route_id?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  vehicle_id?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  driver_user_id?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  origin_warehouse_id?: number;

  @ApiPropertyOptional({ example: '2026-03-25' })
  @IsOptional()
  @IsDateString()
  scheduled_date?: string;

  @ApiPropertyOptional({ example: 'Deliver before noon' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: [1, 2, 3] })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @Type(() => Number)
  @IsInt({ each: true })
  stop_sale_order_ids?: number[];
}
