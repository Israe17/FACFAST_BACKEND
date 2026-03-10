import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MinLength } from 'class-validator';
import {
  GENERIC_ENTITY_CODE_PATTERN,
  ROLE_KEY_PATTERN,
} from '../../common/utils/validation-patterns.util';

export class CreateRoleDto {
  @ApiPropertyOptional({ example: 'RL-0007' })
  @IsOptional()
  @Matches(GENERIC_ENTITY_CODE_PATTERN)
  code?: string;

  @ApiProperty({ example: 'Administrador' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty({
    example: 'admin',
    description: 'Clave de negocio del rol.',
  })
  @IsString()
  @Matches(ROLE_KEY_PATTERN)
  role_key!: string;
}
