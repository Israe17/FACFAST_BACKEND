import { ApiProperty } from '@nestjs/swagger';
import { ArrayUnique, IsArray, IsInt } from 'class-validator';

export class AssignUserRolesDto {
  @ApiProperty({
    type: [Number],
    example: [1, 2],
    description: 'IDs de roles a asignar al usuario.',
  })
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  role_ids!: number[];
}
