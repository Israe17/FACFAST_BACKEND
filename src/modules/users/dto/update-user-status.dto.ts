import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { UserStatus } from '../../common/enums/user-status.enum';
import { validation_messages } from '../../common/validation/validation-message.util';

export class UpdateUserStatusDto {
  @ApiProperty({ enum: UserStatus, example: UserStatus.ACTIVE })
  @IsEnum(UserStatus, { message: validation_messages.invalid_enum() })
  status!: UserStatus;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean({ message: validation_messages.invalid_boolean() })
  allow_login?: boolean;
}
