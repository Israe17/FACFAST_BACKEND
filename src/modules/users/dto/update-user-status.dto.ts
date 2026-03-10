import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { UserStatus } from '../../common/enums/user-status.enum';

export class UpdateUserStatusDto {
  @ApiProperty({ enum: UserStatus, example: UserStatus.ACTIVE })
  @IsEnum(UserStatus)
  status!: UserStatus;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  allow_login?: boolean;
}
