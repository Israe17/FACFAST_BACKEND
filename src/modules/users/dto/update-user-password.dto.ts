import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class UpdateUserPasswordDto {
  @ApiProperty({ example: 'NewPassword123', minLength: 10 })
  @IsString()
  @MinLength(10)
  password!: string;
}
