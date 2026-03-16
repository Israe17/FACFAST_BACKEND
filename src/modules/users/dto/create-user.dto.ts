import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import { UserStatus } from '../../common/enums/user-status.enum';
import { UserType } from '../../common/enums/user-type.enum';
import { GENERIC_ENTITY_CODE_PATTERN } from '../../common/utils/validation-patterns.util';
import { validation_messages } from '../../common/validation/validation-message.util';

export class CreateUserDto {
  @ApiPropertyOptional({
    example: 'US-0009',
    description: 'Codigo funcional manual opcional.',
  })
  @IsOptional()
  @Matches(GENERIC_ENTITY_CODE_PATTERN, {
    message: validation_messages.pattern_mismatch(),
  })
  code?: string;

  @ApiProperty({ example: 'Cajero Principal' })
  @IsString({ message: validation_messages.invalid_string() })
  @MinLength(2, { message: validation_messages.min_length() })
  name!: string;

  @ApiProperty({ example: 'cajero@empresa.com' })
  @IsEmail({}, { message: validation_messages.invalid_email() })
  email!: string;

  @ApiProperty({ example: 'Password123', minLength: 10 })
  @IsString({ message: validation_messages.invalid_string() })
  @MinLength(10, { message: validation_messages.min_length() })
  password!: string;

  @ApiPropertyOptional({ enum: UserStatus, example: UserStatus.ACTIVE })
  @IsOptional()
  @IsEnum(UserStatus, { message: validation_messages.invalid_enum() })
  status?: UserStatus;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean({ message: validation_messages.invalid_boolean() })
  allow_login?: boolean;

  @ApiPropertyOptional({ enum: UserType, example: UserType.STAFF })
  @IsOptional()
  @IsEnum(UserType, { message: validation_messages.invalid_enum() })
  user_type?: UserType;

  @ApiPropertyOptional({
    example: 10,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @Min(0, { message: validation_messages.min_value() })
  @Max(100, { message: validation_messages.max_value() })
  max_sale_discount?: number;

  @ApiPropertyOptional({
    type: [Number],
    example: [1, 2],
    description: 'IDs de roles a asignar.',
  })
  @IsOptional()
  @IsArray({ message: validation_messages.array_required() })
  @ArrayUnique({ message: validation_messages.array_unique() })
  @IsInt({ each: true, message: validation_messages.invalid_number() })
  role_ids?: number[];

  @ApiPropertyOptional({
    type: [Number],
    example: [1, 3],
    description: 'IDs de sucursales a asignar.',
  })
  @IsOptional()
  @IsArray({ message: validation_messages.array_required() })
  @ArrayUnique({ message: validation_messages.array_unique() })
  @IsInt({ each: true, message: validation_messages.invalid_number() })
  branch_ids?: number[];
}
