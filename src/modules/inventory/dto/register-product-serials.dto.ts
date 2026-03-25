import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsString,
  Min,
} from 'class-validator';

export class RegisterProductSerialsDto {
  @ApiProperty({
    description: 'Lista de seriales a registrar para la variante.',
    type: [String],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  serial_numbers!: string[];

  @ApiProperty({
    description: 'Bodega donde se reciben inicialmente los seriales.',
    type: Number,
  })
  @IsInt()
  @Min(1)
  warehouse_id!: number;
}
