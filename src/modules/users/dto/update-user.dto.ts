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
import { validation_messages } from '../../common/validation/validation-message.util';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'US-0042' })
  @IsOptional()
  @Matches(GENERIC_ENTITY_CODE_PATTERN, {
    message: validation_messages.pattern_mismatch(),
  })
  code?: string;

  @ApiPropertyOptional({ example: 'Supervisor de Tienda' })
  @IsOptional()
  @IsString({ message: validation_messages.invalid_string() })
  @MinLength(2, { message: validation_messages.min_length() })
  name?: string;

  @ApiPropertyOptional({ example: 'supervisor@empresa.com' })
  @IsOptional()
  @IsEmail({}, { message: validation_messages.invalid_email() })
  email?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean({ message: validation_messages.invalid_boolean() })
  allow_login?: boolean;

  @ApiPropertyOptional({ enum: UserType, example: UserType.STAFF })
  @IsOptional()
  @IsEnum(UserType, { message: validation_messages.invalid_enum() })
  user_type?: UserType;

  @ApiPropertyOptional({ example: 15, minimum: 0, maximum: 100 })
  @IsOptional()
  @Min(0, { message: validation_messages.min_value() })
  @Max(100, { message: validation_messages.max_value() })
  max_sale_discount?: number;
}
