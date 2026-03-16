import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';
import { validation_messages } from '../../common/validation/validation-message.util';

export class UpdateUserPasswordDto {
  @ApiProperty({ example: 'NewPassword123', minLength: 10 })
  @IsString({ message: validation_messages.invalid_string() })
  @MinLength(10, { message: validation_messages.min_length() })
  password!: string;
}
