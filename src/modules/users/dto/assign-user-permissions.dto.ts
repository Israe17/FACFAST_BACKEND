import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayUnique, IsArray, IsInt } from 'class-validator';
import { validation_messages } from '../../common/validation/validation-message.util';

export class AssignUserPermissionsDto {
  @ApiProperty({
    type: [Number],
    example: [1, 2],
    description:
      'Replaces the full set of direct permission grants assigned to the user. ' +
      'Only permissions in the auth.* namespace are accepted. ' +
      'Send [] to clear all direct grants.',
  })
  @Type(() => Number)
  @IsArray({ message: validation_messages.array_required() })
  @ArrayUnique({ message: validation_messages.array_unique() })
  @IsInt({ each: true, message: validation_messages.invalid_number() })
  permission_ids!: number[];
}
