import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MinLength } from 'class-validator';
import {
  GENERIC_ENTITY_CODE_PATTERN,
  ROLE_KEY_PATTERN,
} from '../../common/utils/validation-patterns.util';
import { validation_messages } from '../../common/validation/validation-message.util';

export class CreateRoleDto {
  @ApiPropertyOptional({ example: 'RL-0007' })
  @IsOptional()
  @Matches(GENERIC_ENTITY_CODE_PATTERN, {
    message: validation_messages.pattern_mismatch(),
  })
  code?: string;

  @ApiProperty({ example: 'Administrador' })
  @IsString({ message: validation_messages.invalid_string() })
  @MinLength(2, { message: validation_messages.min_length() })
  name!: string;

  @ApiProperty({
    example: 'admin',
    description: 'Clave de negocio del rol.',
  })
  @IsString({ message: validation_messages.invalid_string() })
  @Matches(ROLE_KEY_PATTERN, {
    message: validation_messages.pattern_mismatch(),
  })
  role_key!: string;
}
