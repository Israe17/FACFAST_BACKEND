import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsPositive } from 'class-validator';
import { validation_messages } from '../../common/validation/validation-message.util';

export class EnterBusinessContextDto {
  @ApiProperty({
    description:
      'Empresa sobre la que el platform admin operara temporalmente.',
    example: 7,
  })
  @Type(() => Number)
  @IsInt({ message: validation_messages.invalid_number() })
  @IsPositive({ message: validation_messages.positive_number() })
  business_id!: number;

  @ApiPropertyOptional({
    description:
      'Sucursal operativa opcional para acotar el contexto del platform admin.',
    example: 12,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: validation_messages.invalid_number() })
  @IsPositive({ message: validation_messages.positive_number() })
  branch_id?: number;
}
