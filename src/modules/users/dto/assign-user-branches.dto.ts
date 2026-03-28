import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayUnique, IsArray, IsInt } from 'class-validator';
import { validation_messages } from '../../common/validation/validation-message.util';

export class AssignUserBranchesDto {
  @ApiProperty({
    type: [Number],
    example: [1, 3],
    description:
      'Replaces the full branch access set assigned to the user. Send [] to clear all branch access.',
  })
  @Type(() => Number)
  @IsArray({ message: validation_messages.array_required() })
  @ArrayUnique({ message: validation_messages.array_unique() })
  @IsInt({ each: true, message: validation_messages.invalid_number() })
  branch_ids!: number[];
}
