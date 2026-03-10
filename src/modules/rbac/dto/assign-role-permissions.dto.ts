import { ApiProperty } from '@nestjs/swagger';
import { ArrayUnique, IsArray, IsInt } from 'class-validator';

export class AssignRolePermissionsDto {
  @ApiProperty({
    type: [Number],
    example: [1, 2, 3],
    description: 'IDs de permisos a asignar al rol.',
  })
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  permission_ids!: number[];
}
