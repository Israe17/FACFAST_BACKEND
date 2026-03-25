import { Injectable } from '@nestjs/common';
import { QueryUseCase } from '../../common/application/interfaces/query-use-case.interface';
import { CursorQueryDto } from '../../common/dto/cursor-query.dto';
import { CursorResponseDto } from '../../common/dto/cursor-response.dto';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { ProductView } from '../contracts/product.view';
import { ProductsRepository } from '../repositories/products.repository';
import { ProductSerializer } from '../serializers/product.serializer';

export type GetProductsCursorQuery = {
  current_user: AuthenticatedUserContext;
  query: CursorQueryDto;
};

@Injectable()
export class GetProductsCursorQueryUseCase
  implements QueryUseCase<GetProductsCursorQuery, CursorResponseDto<ProductView>>
{
  constructor(
    private readonly products_repository: ProductsRepository,
    private readonly product_serializer: ProductSerializer,
  ) {}

  async execute({
    current_user,
    query,
  }: GetProductsCursorQuery): Promise<CursorResponseDto<ProductView>> {
    return this.products_repository.find_cursor_by_business(
      resolve_effective_business_id(current_user),
      query,
      (product) => this.product_serializer.serialize(product),
    );
  }
}
