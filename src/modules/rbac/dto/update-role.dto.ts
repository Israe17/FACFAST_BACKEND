import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MinLength } from 'class-validator';
import {
  GENERIC_ENTITY_CODE_PATTERN,
  ROLE_KEY_PATTERN,
} from '../../common/utils/validation-patterns.util';

export class UpdateRoleDto {
  @ApiPropertyOptional({ example: 'RL-0007' })
  @IsOptional()
  @Matches(GENERIC_ENTITY_CODE_PATTERN)
  code?: string;

  @ApiPropertyOptional({ example: 'Administrador Regional' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiPropertyOptional({ example: 'admin_regional' })
  @IsOptional()
  @IsString()
  @Matches(ROLE_KEY_PATTERN)
  role_key?: string;
}
