import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { GENERIC_ENTITY_CODE_PATTERN } from '../../common/utils/validation-patterns.util';
import { IsTerminalNumber } from '../validators/is-terminal-number.validator';

export class UpdateTerminalDto {
  @ApiPropertyOptional({ example: 'TR-0001' })
  @IsOptional()
  @Matches(GENERIC_ENTITY_CODE_PATTERN)
  code?: string;

  @ApiPropertyOptional({ example: '00002' })
  @IsOptional()
  @IsTerminalNumber()
  terminal_number?: string;

  @ApiPropertyOptional({ example: 'Caja 2' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
