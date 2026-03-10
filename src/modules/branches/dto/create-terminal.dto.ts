import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { GENERIC_ENTITY_CODE_PATTERN } from '../../common/utils/validation-patterns.util';
import { IsTerminalNumber } from '../validators/is-terminal-number.validator';

export class CreateTerminalDto {
  @ApiPropertyOptional({ example: 'TR-0001' })
  @IsOptional()
  @Matches(GENERIC_ENTITY_CODE_PATTERN)
  code?: string;

  @ApiProperty({ example: '00001' })
  @IsTerminalNumber()
  terminal_number!: string;

  @ApiProperty({ example: 'Caja 1' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
