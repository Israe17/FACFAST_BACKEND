import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import { UserType } from '../../common/enums/user-type.enum';
import { GENERIC_ENTITY_CODE_PATTERN } from '../../common/utils/validation-patterns.util';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'US-0042' })
  @IsOptional()
  @Matches(GENERIC_ENTITY_CODE_PATTERN)
  code?: string;

  @ApiPropertyOptional({ example: 'Supervisor de Tienda' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiPropertyOptional({ example: 'supervisor@empresa.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  allow_login?: boolean;

  @ApiPropertyOptional({ enum: UserType, example: UserType.STAFF })
  @IsOptional()
  @IsEnum(UserType)
  user_type?: UserType;

  @ApiPropertyOptional({ example: 15, minimum: 0, maximum: 100 })
  @IsOptional()
  @Min(0)
  @Max(100)
  max_sale_discount?: number;
}
