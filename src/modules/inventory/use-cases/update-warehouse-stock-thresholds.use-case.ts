import { Injectable } from '@nestjs/common';
import { CommandUseCase } from '../../common/application/interfaces/command-use-case.interface';
import { DomainBadRequestException } from '../../common/errors/exceptions/domain-bad-request.exception';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { WarehouseStockThresholdsView } from '../contracts/warehouse-stock-thresholds.view';
import { UpdateWarehouseStockThresholdsDto } from '../dto/update-warehouse-stock-thresholds.dto';
import { ProductVariantsRepository } from '../repositories/product-variants.repository';
import { WarehouseStockRepository } from '../repositories/warehouse-stock.repository';
import { InventoryValidationService } from '../services/inventory-validation.service';

export type UpdateWarehouseStockThresholdsCommand = {
  current_user: AuthenticatedUserContext;
  warehouse_id: number;
  product_variant_id: number;
  dto: UpdateWarehouseStockThresholdsDto;
};

@Injectable()
export class UpdateWarehouseStockThresholdsUseCase
  implements
    CommandUseCase<
      UpdateWarehouseStockThresholdsCommand,
      WarehouseStockThresholdsView
    >
{
  constructor(
    private readonly warehouse_stock_repository: WarehouseStockRepository,
    private readonly product_variants_repository: ProductVariantsRepository,
    private readonly inventory_validation_service: InventoryValidationService,
  ) {}

  async execute({
    current_user,
    warehouse_id,
    product_variant_id,
    dto,
  }: UpdateWarehouseStockThresholdsCommand): Promise<WarehouseStockThresholdsView> {
    const business_id = resolve_effective_business_id(current_user);

    const warehouse =
      await this.inventory_validation_service.get_warehouse_for_operation(
        current_user,
        warehouse_id,
        { require_active: true },
      );

    const variant =
      await this.product_variants_repository.find_by_id_in_business(
        product_variant_id,
        business_id,
      );
    if (!variant) {
      throw new DomainBadRequestException({
        code: 'PRODUCT_VARIANT_NOT_FOUND',
        messageKey: 'inventory.product_variant_not_found',
        details: { product_variant_id },
      });
    }
    this.inventory_validation_service.assert_variant_is_active(variant);

    const existing =
      await this.warehouse_stock_repository.find_by_warehouse_and_product(
        business_id,
        warehouse.id,
        variant.product_id,
        variant.id,
      );

    const row =
      existing ??
      this.warehouse_stock_repository.create({
        business_id,
        branch_id: warehouse.branch_id,
        warehouse_id: warehouse.id,
        product_id: variant.product_id,
        product_variant_id: variant.id,
        quantity: 0,
        reserved_quantity: 0,
      });

    const next_min =
      dto.min_stock !== undefined
        ? this.normalize_threshold(dto.min_stock)
        : (row.min_stock ?? null);
    const next_max =
      dto.max_stock !== undefined
        ? this.normalize_threshold(dto.max_stock)
        : (row.max_stock ?? null);

    if (next_min !== null && next_max !== null && next_max < next_min) {
      throw new DomainBadRequestException({
        code: 'WAREHOUSE_STOCK_MAX_BELOW_MIN',
        messageKey: 'inventory.warehouse_stock_max_below_min',
        details: { min_stock: next_min, max_stock: next_max },
      });
    }

    row.min_stock = next_min;
    row.max_stock = next_max;

    const saved = await this.warehouse_stock_repository.save(row);

    return {
      warehouse_id: saved.warehouse_id,
      product_variant_id: saved.product_variant_id ?? variant.id,
      product_id: saved.product_id,
      min_stock: saved.min_stock,
      max_stock: saved.max_stock,
      updated_at: saved.updated_at,
    };
  }

  private normalize_threshold(value: number | null | undefined): number | null {
    if (value === undefined || value === null) {
      return null;
    }
    return value;
  }
}
