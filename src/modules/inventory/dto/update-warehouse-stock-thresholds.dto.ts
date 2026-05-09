import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, Max, Min, ValidateIf } from 'class-validator';

export class UpdateWarehouseStockThresholdsDto {
  @ApiPropertyOptional({
    description:
      'Stock minimo a partir del cual la UI marca la fila como bajo minimo. Enviar null para borrar el umbral.',
    example: 5,
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  @Max(9_999_999)
  min_stock?: number | null;

  @ApiPropertyOptional({
    description:
      'Stock maximo de la combinacion bodega-variante. Enviar null para borrar el umbral.',
    example: 50,
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  @Max(9_999_999)
  max_stock?: number | null;
}
