import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import {
  GENERIC_ENTITY_CODE_PATTERN,
  NUMERIC_STRING_PATTERN,
} from '../../common/utils/validation-patterns.util';
import { ProductType } from '../enums/product-type.enum';

export class InitialProductSerialsDto {
  @ApiProperty({
    description:
      'Lista de seriales (IMEI, VIN, placa, etc.) a registrar en la variante por defecto al crear el producto.',
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

export class CreateProductDto {
  @ApiPropertyOptional({ example: 'PD-0001' })
  @IsOptional()
  @Matches(GENERIC_ENTITY_CODE_PATTERN)
  code?: string;

  @ApiProperty({ enum: ProductType, example: ProductType.PRODUCT })
  @IsEnum(ProductType)
  type!: ProductType;

  @ApiProperty({ example: 'Llanta 185/65 R15' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiPropertyOptional({ example: 'Llanta radial para automovil' })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  category_id?: number | null;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  brand_id?: number | null;

  @ApiPropertyOptional({ example: 'SKU-LL-185' })
  @IsOptional()
  @IsString()
  sku?: string | null;

  @ApiPropertyOptional({ example: '7501234567890' })
  @IsOptional()
  @IsString()
  barcode?: string | null;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  stock_unit_id?: number | null;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  sale_unit_id?: number | null;

  @ApiPropertyOptional({
    example: 1,
    description:
      'Perfil fiscal asignado. Opcional si se envia cabys_code: el sistema buscara o creara un perfil fiscal a partir del CABYS.',
  })
  @IsOptional()
  @IsInt()
  tax_profile_id?: number;

  @ApiPropertyOptional({
    example: '4481606020000',
    description:
      'Codigo CABYS de Hacienda (13 digitos). Si se envia y no hay tax_profile_id, el sistema asigna el perfil fiscal asociado al CABYS (lo crea si no existe).',
  })
  @IsOptional()
  @IsString()
  @Matches(NUMERIC_STRING_PATTERN)
  cabys_code?: string | null;

  @ApiPropertyOptional({
    example: 'Servicios de software a la medida',
    description:
      'Descripcion del CABYS, usada solo si se autocreara el perfil fiscal.',
  })
  @IsOptional()
  @IsString()
  cabys_descripcion?: string | null;

  @ApiPropertyOptional({
    example: 13,
    description:
      'Tasa de impuesto del CABYS reportada por Hacienda. Solo se usa al autocrear el perfil fiscal.',
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  @Max(100)
  cabys_impuesto?: number | null;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  track_inventory?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  track_lots?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  track_expiration?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  track_serials?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  allow_negative_stock?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  has_variants?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  has_warranty?: boolean;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  warranty_profile_id?: number | null;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({
    type: InitialProductSerialsDto,
    description:
      'Seriales iniciales para registrar en la variante por defecto. Solo se aceptan si track_serials esta activo.',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => InitialProductSerialsDto)
  initial_serials?: InitialProductSerialsDto;
}
