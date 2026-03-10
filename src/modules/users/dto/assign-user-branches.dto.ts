import { ApiProperty } from '@nestjs/swagger';
import { ArrayUnique, IsArray, IsInt } from 'class-validator';

export class AssignUserBranchesDto {
  @ApiProperty({
    type: [Number],
    example: [1, 3],
    description: 'IDs de sucursales a asignar al usuario.',
  })
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  branch_ids!: number[];
}
