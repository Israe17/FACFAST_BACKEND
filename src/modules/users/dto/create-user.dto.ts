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

export class CreateUserDto {
  @ApiPropertyOptional({
    example: 'US-0009',
    description: 'Codigo funcional manual opcional.',
  })
  @IsOptional()
  @Matches(GENERIC_ENTITY_CODE_PATTERN)
  code?: string;

  @ApiProperty({ example: 'Cajero Principal' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty({ example: 'cajero@empresa.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Password123', minLength: 10 })
  @IsString()
  @MinLength(10)
  password!: string;

  @ApiPropertyOptional({ enum: UserStatus, example: UserStatus.ACTIVE })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  allow_login?: boolean;

  @ApiPropertyOptional({ enum: UserType, example: UserType.STAFF })
  @IsOptional()
  @IsEnum(UserType)
  user_type?: UserType;

  @ApiPropertyOptional({
    example: 10,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @Min(0)
  @Max(100)
  max_sale_discount?: number;

  @ApiPropertyOptional({
    type: [Number],
    example: [1, 2],
    description: 'IDs de roles a asignar.',
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  role_ids?: number[];

  @ApiPropertyOptional({
    type: [Number],
    example: [1, 3],
    description: 'IDs de sucursales a asignar.',
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  branch_ids?: number[];
}
