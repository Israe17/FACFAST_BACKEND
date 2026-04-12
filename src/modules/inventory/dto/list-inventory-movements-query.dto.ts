import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginatedQueryDto } from '../../common/dto/paginated-query.dto';

export class ListInventoryMovementsQueryDto extends PaginatedQueryDto {
  @ApiPropertyOptional({ description: 'Filter by source document type' })
  @IsOptional()
  @IsString()
  source_document_type?: string;

  @ApiPropertyOptional({
    description: 'Filter by source document ID',
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  source_document_id?: number;
}
