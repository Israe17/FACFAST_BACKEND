import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayUnique, IsArray, IsInt } from 'class-validator';
import { validation_messages } from '../../common/validation/validation-message.util';

export class AssignRolePermissionsDto {
  @ApiProperty({
    type: [Number],
    example: [1, 2, 3],
    description:
      'Replaces the full permission set assigned to the role. Send [] to clear all permissions.',
  })
  @Type(() => Number)
  @IsArray({ message: validation_messages.array_required() })
  @ArrayUnique({ message: validation_messages.array_unique() })
  @IsInt({ each: true, message: validation_messages.invalid_number() })
  permission_ids!: number[];
}
