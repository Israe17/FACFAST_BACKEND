import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayUnique, IsArray, IsInt } from 'class-validator';
import { validation_messages } from '../../common/validation/validation-message.util';

export class AssignUserRolesDto {
  @ApiProperty({
    type: [Number],
    example: [1, 2],
    description:
      'Replaces the full role set assigned to the user. Send [] to clear all roles.',
  })
  @Type(() => Number)
  @IsArray({ message: validation_messages.array_required() })
  @ArrayUnique({ message: validation_messages.array_unique() })
  @IsInt({ each: true, message: validation_messages.invalid_number() })
  role_ids!: number[];
}
