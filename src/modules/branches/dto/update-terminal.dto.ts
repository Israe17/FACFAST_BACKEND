import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { GENERIC_ENTITY_CODE_PATTERN } from '../../common/utils/validation-patterns.util';
import { validation_messages } from '../../common/validation/validation-message.util';
import { IsTerminalNumber } from '../validators/is-terminal-number.validator';

export class UpdateTerminalDto {
  @ApiPropertyOptional({ example: 'TR-0001' })
  @IsOptional()
  @Matches(GENERIC_ENTITY_CODE_PATTERN, {
    message: validation_messages.pattern_mismatch(),
  })
  code?: string;

  @ApiPropertyOptional({ example: '00002' })
  @IsOptional()
  @IsTerminalNumber()
  terminal_number?: string;

  @ApiPropertyOptional({ example: 'Caja 2' })
  @IsOptional()
  @IsString({ message: validation_messages.invalid_string() })
  @MinLength(2, { message: validation_messages.min_length() })
  name?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean({ message: validation_messages.invalid_boolean() })
  is_active?: boolean;
}
