import { ApiProperty } from '@nestjs/swagger';
import { ArrayUnique, IsArray, IsInt } from 'class-validator';
import { validation_messages } from '../../common/validation/validation-message.util';

export class AssignUserBranchesDto {
  @ApiProperty({
    type: [Number],
    example: [1, 3],
    description: 'IDs de sucursales a asignar al usuario.',
  })
  @IsArray({ message: validation_messages.array_required() })
  @ArrayUnique({ message: validation_messages.array_unique() })
  @IsInt({ each: true, message: validation_messages.invalid_number() })
  branch_ids!: number[];
}
