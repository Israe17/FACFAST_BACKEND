import { Injectable } from '@nestjs/common';
import { DomainBadRequestException } from '../../common/errors/exceptions/domain-bad-request.exception';
import { DomainConflictException } from '../../common/errors/exceptions/domain-conflict.exception';
import { DomainNotFoundException } from '../../common/errors/exceptions/domain-not-found.exception';
import { CreateProductVariantDto } from '../dto/create-product-variant.dto';
import { UpdateProductVariantDto } from '../dto/update-product-variant.dto';
import { Product } from '../entities/product.entity';
import { ProductVariant } from '../entities/product-variant.entity';
import { InventoryBalancesRepository } from '../repositories/inventory-balances.repository';
import { InventoryLotsRepository } from '../repositories/inventory-lots.repository';
import { InventoryMovementLinesRepository } from '../repositories/inventory-movement-lines.repository';
import { InventoryMovementsRepository } from '../repositories/inventory-movements.repository';
import { ProductPricesRepository } from '../repositories/product-prices.repository';
import { ProductSerialsRepository } from '../repositories/product-serials.repository';
import { ProductVariantsRepository } from '../repositories/product-variants.repository';
import { PromotionsRepository } from '../repositories/promotions.repository';
import { WarehouseStockRepository } from '../repositories/warehouse-stock.repository';
import { InventoryValidationService } from './inventory-validation.service';

type VariantDependencyCounts = {
  inventory_balances: number;
  inventory_movement_lines: number;
  inventory_movements: number;
  inventory_lots: number;
  product_prices: number;
  product_serials: number;
  promotion_items: number;
  warehouse_stock: number;
};

type VariantLifecycle = {
  can_delete: boolean;
  can_deactivate: boolean;
  can_reactivate: boolean;
  reasons: string[];
  dependencies: VariantDependencyCounts;
};

@Injectable()
export class ProductVariantsService {
  private static readonly DEFAULT_VARIANT_NAME = 'Default';

  constructor(
    private readonly product_variants_repository: ProductVariantsRepository,
    private readonly inventory_validation_service: InventoryValidationService,
    private readonly inventory_balances_repository: InventoryBalancesRepository,
    private readonly inventory_movement_lines_repository: InventoryMovementLinesRepository,
    private readonly inventory_movements_repository: InventoryMovementsRepository,
    private readonly inventory_lots_repository: InventoryLotsRepository,
    private readonly product_prices_repository: ProductPricesRepository,
    private readonly product_serials_repository: ProductSerialsRepository,
    private readonly promotions_repository: PromotionsRepository,
    private readonly warehouse_stock_repository: WarehouseStockRepository,
  ) {}

  async ensure_default_variant_for_product(
    product: Product,
  ): Promise<ProductVariant> {
    const existing_default_variant =
      await this.product_variants_repository.find_default_by_product_in_business(
        product.business_id,
        product.id,
      );

    const default_sku =
      this.normalize_optional_string(product.sku) ??
      this.build_default_variant_sku(product.id);
    const default_barcode = this.normalize_optional_string(product.barcode);

    if (existing_default_variant) {
      if (!product.has_variants) {
        existing_default_variant.sku = default_sku;
        existing_default_variant.barcode = default_barcode;
        existing_default_variant.variant_name = ProductVariantsService.DEFAULT_VARIANT_NAME;
        existing_default_variant.stock_unit_measure_id =
          product.stock_unit_id ?? product.sale_unit_id;
        existing_default_variant.sale_unit_measure_id =
          product.sale_unit_id ?? product.stock_unit_id;
        existing_default_variant.fiscal_profile_id = product.tax_profile_id;
        existing_default_variant.default_warranty_profile_id =
          product.has_warranty ? product.warranty_profile_id : null;
        existing_default_variant.track_inventory = product.track_inventory;
        existing_default_variant.track_lots = product.track_lots;
        existing_default_variant.track_expiration = product.track_expiration;
        existing_default_variant.track_serials = product.track_serials;
        existing_default_variant.allow_negative_stock =
          product.allow_negative_stock;
        existing_default_variant.is_active = product.is_active;
      }
      return this.product_variants_repository.save(existing_default_variant);
    }

    return this.product_variants_repository.save(
      this.product_variants_repository.create({
        business_id: product.business_id,
        product_id: product.id,
        sku: default_sku,
        barcode: default_barcode,
        variant_name: ProductVariantsService.DEFAULT_VARIANT_NAME,
        stock_unit_measure_id: product.stock_unit_id ?? product.sale_unit_id,
        sale_unit_measure_id: product.sale_unit_id ?? product.stock_unit_id,
        fiscal_profile_id: product.tax_profile_id,
        default_warranty_profile_id: product.has_warranty
          ? product.warranty_profile_id
          : null,
        is_default: true,
        track_inventory: product.track_inventory,
        track_lots: product.track_lots,
        track_expiration: product.track_expiration,
        track_serials: product.track_serials,
        allow_negative_stock: product.allow_negative_stock,
        is_active: product.is_active,
      }),
    );
  }

  async resolve_product_and_variant_for_operation(
    business_id: number,
    payload: {
      product_id?: number | null;
      product_variant_id?: number | null;
      require_active?: boolean;
    },
  ): Promise<{ product: Product; product_variant: ProductVariant }> {
    const require_active = payload.require_active ?? true;

    if (payload.product_id !== undefined && payload.product_id !== null) {
      const product =
        await this.inventory_validation_service.get_product_in_business(
          business_id,
          payload.product_id,
          {
            require_active,
          },
        );
      const product_variant = await this.resolve_variant_for_operation(
        business_id,
        product,
        payload.product_variant_id,
      );
      return {
        product,
        product_variant,
      };
    }

    if (
      payload.product_variant_id !== undefined &&
      payload.product_variant_id !== null
    ) {
      const product_variant = await this.get_variant_entity(
        business_id,
        payload.product_variant_id,
      );

      if (!product_variant.product) {
        throw new DomainNotFoundException({
          code: 'PRODUCT_NOT_FOUND',
          messageKey: 'inventory.product_not_found',
          details: {
            product_variant_id: payload.product_variant_id,
          },
        });
      }

      if (require_active) {
        this.inventory_validation_service.assert_product_is_active(
          product_variant.product,
        );
        this.inventory_validation_service.assert_variant_is_active(
          product_variant,
        );
      }

      return {
        product: product_variant.product,
        product_variant,
      };
    }

    throw new DomainBadRequestException({
      code: 'PRODUCT_OR_VARIANT_REQUIRED',
      messageKey: 'inventory.product_or_variant_required',
      details: {
        field: 'product_id',
      },
    });
  }

  async resolve_variant_for_operation(
    business_id: number,
    product: Product,
    product_variant_id?: number | null,
  ): Promise<ProductVariant> {
    if (product_variant_id) {
      const variant = await this.get_variant_entity(
        business_id,
        product_variant_id,
      );
      this.inventory_validation_service.assert_variant_belongs_to_product(
        product,
        variant,
      );
      this.inventory_validation_service.assert_variant_is_active(variant);
      return variant;
    }
    if (product.has_variants) {
      throw new DomainBadRequestException({
        code: 'VARIANT_REQUIRED_FOR_MULTI_VARIANT_PRODUCT',
        messageKey: 'inventory.variant_required_for_multi_variant_product',
        details: { product_id: product.id },
      });
    }
    return this.ensure_default_variant_for_product(product);
  }

  async create_variant(
    business_id: number,
    product: Product,
    dto: CreateProductVariantDto,
  ): Promise<ProductVariant> {
    if (!product.has_variants) {
      throw new DomainBadRequestException({
        code: 'PRODUCT_DOES_NOT_SUPPORT_VARIANTS',
        messageKey: 'inventory.product_does_not_support_variants',
        details: { product_id: product.id },
      });
    }

    const normalized_sku = dto.sku.trim();
    const normalized_barcode = this.normalize_optional_string(dto.barcode);

    if (
      await this.product_variants_repository.exists_sku_in_business(
        business_id,
        normalized_sku,
      )
    ) {
      throw new DomainConflictException({
        code: 'VARIANT_SKU_DUPLICATE',
        messageKey: 'inventory.variant_sku_duplicate',
        details: { field: 'sku' },
      });
    }

    if (
      normalized_barcode &&
      (await this.product_variants_repository.exists_barcode_in_business(
        business_id,
        normalized_barcode,
      ))
    ) {
      throw new DomainConflictException({
        code: 'VARIANT_BARCODE_DUPLICATE',
        messageKey: 'inventory.variant_barcode_duplicate',
        details: { field: 'barcode' },
      });
    }

    await this.inventory_validation_service.get_tax_profile_in_business(
      business_id,
      dto.fiscal_profile_id,
      {
        require_active: true,
      },
    );

    if (dto.stock_unit_measure_id) {
      await this.inventory_validation_service.get_measurement_unit_in_business(
        business_id,
        dto.stock_unit_measure_id,
        {
          require_active: true,
        },
      );
    }
    if (dto.sale_unit_measure_id) {
      await this.inventory_validation_service.get_measurement_unit_in_business(
        business_id,
        dto.sale_unit_measure_id,
        {
          require_active: true,
        },
      );
    }
    if (dto.default_warranty_profile_id) {
      await this.inventory_validation_service.get_warranty_profile_in_business(
        business_id,
        dto.default_warranty_profile_id,
        {
          require_active: true,
        },
      );
    }

    const variant = this.product_variants_repository.create({
      business_id,
      product_id: product.id,
      sku: normalized_sku,
      barcode: normalized_barcode,
      variant_name: dto.variant_name.trim(),
      stock_unit_measure_id: dto.stock_unit_measure_id ?? null,
      sale_unit_measure_id: dto.sale_unit_measure_id ?? null,
      fiscal_profile_id: dto.fiscal_profile_id,
      default_warranty_profile_id: dto.default_warranty_profile_id ?? null,
      is_default: false,
      track_inventory: dto.track_inventory ?? true,
      track_lots: dto.track_lots ?? false,
      track_expiration: dto.track_expiration ?? false,
      allow_negative_stock: dto.allow_negative_stock ?? false,
      track_serials: product.track_serials,
      is_active: dto.is_active ?? true,
    });

    this.apply_variant_rules(variant);
    return this.product_variants_repository.save(variant);
  }

  async update_variant(
    business_id: number,
    variant_id: number,
    dto: UpdateProductVariantDto,
  ): Promise<ProductVariant> {
    const variant = await this.get_variant_entity(business_id, variant_id);

    if (variant.is_default && !variant.product?.has_variants) {
      throw new DomainBadRequestException({
        code: 'CANNOT_EDIT_DEFAULT_VARIANT_OF_SIMPLE_PRODUCT',
        messageKey: 'inventory.cannot_edit_default_variant_of_simple_product',
        details: { variant_id },
      });
    }

    if (dto.sku !== undefined) {
      const normalized_sku = dto.sku.trim();
      if (
        await this.product_variants_repository.exists_sku_in_business(
          business_id,
          normalized_sku,
          variant.id,
        )
      ) {
        throw new DomainConflictException({
          code: 'VARIANT_SKU_DUPLICATE',
          messageKey: 'inventory.variant_sku_duplicate',
          details: { field: 'sku' },
        });
      }
      variant.sku = normalized_sku;
    }

    if (dto.barcode !== undefined) {
      const normalized_barcode = this.normalize_optional_string(dto.barcode);
      if (
        normalized_barcode &&
        (await this.product_variants_repository.exists_barcode_in_business(
          business_id,
          normalized_barcode,
          variant.id,
        ))
      ) {
        throw new DomainConflictException({
          code: 'VARIANT_BARCODE_DUPLICATE',
          messageKey: 'inventory.variant_barcode_duplicate',
          details: { field: 'barcode' },
        });
      }
      variant.barcode = normalized_barcode;
    }

    if (dto.variant_name !== undefined) {
      variant.variant_name = dto.variant_name.trim();
    }
    if (dto.fiscal_profile_id !== undefined) {
      await this.inventory_validation_service.get_tax_profile_in_business(
        business_id,
        dto.fiscal_profile_id,
        {
          require_active: true,
        },
      );
      variant.fiscal_profile_id = dto.fiscal_profile_id;
    }
    if (dto.stock_unit_measure_id !== undefined) {
      if (dto.stock_unit_measure_id) {
        await this.inventory_validation_service.get_measurement_unit_in_business(
          business_id,
          dto.stock_unit_measure_id,
          {
            require_active: true,
          },
        );
      }
      variant.stock_unit_measure_id = dto.stock_unit_measure_id;
    }
    if (dto.sale_unit_measure_id !== undefined) {
      if (dto.sale_unit_measure_id) {
        await this.inventory_validation_service.get_measurement_unit_in_business(
          business_id,
          dto.sale_unit_measure_id,
          {
            require_active: true,
          },
        );
      }
      variant.sale_unit_measure_id = dto.sale_unit_measure_id;
    }
    if (dto.default_warranty_profile_id !== undefined) {
      if (dto.default_warranty_profile_id) {
        await this.inventory_validation_service.get_warranty_profile_in_business(
          business_id,
          dto.default_warranty_profile_id,
          {
            require_active: true,
          },
        );
      }
      variant.default_warranty_profile_id = dto.default_warranty_profile_id;
    }
    if (dto.track_inventory !== undefined) {
      variant.track_inventory = dto.track_inventory;
    }
    if (dto.track_lots !== undefined) {
      variant.track_lots = dto.track_lots;
    }
    if (dto.track_expiration !== undefined) {
      variant.track_expiration = dto.track_expiration;
    }
    if (dto.allow_negative_stock !== undefined) {
      variant.allow_negative_stock = dto.allow_negative_stock;
    }
    if (dto.is_active !== undefined) {
      variant.is_active = dto.is_active;
    }

    this.apply_variant_rules(variant);
    return this.product_variants_repository.save(variant);
  }

  async list_variants(
    business_id: number,
    product_id: number,
  ): Promise<ProductVariant[]> {
    return this.product_variants_repository.find_all_by_product_in_business(
      business_id,
      product_id,
    );
  }

  async get_variant(
    business_id: number,
    variant_id: number,
  ): Promise<ProductVariant> {
    return this.get_variant_entity(business_id, variant_id);
  }

  async deactivate_variant(
    business_id: number,
    variant_id: number,
  ): Promise<ProductVariant> {
    const variant = await this.get_variant_entity(business_id, variant_id);

    if (variant.is_default) {
      throw new DomainBadRequestException({
        code: 'CANNOT_DEACTIVATE_DEFAULT_VARIANT',
        messageKey: 'inventory.cannot_deactivate_default_variant',
        details: { variant_id },
      });
    }

    const active_count =
      await this.product_variants_repository.count_active_by_product(
        business_id,
        variant.product_id,
      );

    if (active_count <= 1) {
      throw new DomainBadRequestException({
        code: 'CANNOT_DEACTIVATE_LAST_ACTIVE_VARIANT',
        messageKey: 'inventory.cannot_deactivate_last_active_variant',
        details: { variant_id },
      });
    }

    variant.is_active = false;
    return this.product_variants_repository.save(variant);
  }

  async delete_variant_permanently(
    business_id: number,
    variant_id: number,
  ): Promise<{ id: number; deleted: true }> {
    const variant = await this.get_variant_entity(business_id, variant_id);
    const lifecycle = await this.build_variant_lifecycle(variant);

    if (!lifecycle.can_delete) {
      throw new DomainBadRequestException({
        code: 'PRODUCT_VARIANT_DELETE_FORBIDDEN',
        messageKey: 'inventory.product_variant_delete_forbidden',
        details: {
          variant_id,
          reasons: lifecycle.reasons,
          dependencies: lifecycle.dependencies,
        },
      });
    }

    await this.product_variants_repository.remove(variant);
    return {
      id: variant_id,
      deleted: true,
    };
  }

  async count_non_default_variants(
    business_id: number,
    product_id: number,
  ): Promise<number> {
    return this.product_variants_repository.count_non_default_by_product(
      business_id,
      product_id,
    );
  }

  async serialize_variant(variant: ProductVariant) {
    const lifecycle = await this.build_variant_lifecycle(variant);

    return {
      id: variant.id,
      business_id: variant.business_id,
      product_id: variant.product_id,
      sku: variant.sku,
      barcode: variant.barcode,
      variant_name: variant.variant_name,
      stock_unit_measure: variant.stock_unit_measure
        ? {
            id: variant.stock_unit_measure.id,
            name: variant.stock_unit_measure.name,
            symbol: variant.stock_unit_measure.symbol,
          }
        : null,
      sale_unit_measure: variant.sale_unit_measure
        ? {
            id: variant.sale_unit_measure.id,
            name: variant.sale_unit_measure.name,
            symbol: variant.sale_unit_measure.symbol,
          }
        : null,
      fiscal_profile: variant.fiscal_profile
        ? {
            id: variant.fiscal_profile.id,
            name: variant.fiscal_profile.name,
          }
        : null,
      default_warranty_profile: variant.default_warranty_profile
        ? {
            id: variant.default_warranty_profile.id,
            name: variant.default_warranty_profile.name,
          }
        : null,
      is_default: variant.is_default,
      track_inventory: variant.track_inventory,
      track_lots: variant.track_lots,
      track_expiration: variant.track_expiration,
      allow_negative_stock: variant.allow_negative_stock,
      is_active: variant.is_active,
      lifecycle,
      created_at: variant.created_at,
      updated_at: variant.updated_at,
      attribute_values: (variant.attribute_values ?? []).map((av) => ({
        id: av.id,
        value: av.value,
        attribute_id: av.attribute_id,
      })),
    };
  }

  private async get_variant_entity(
    business_id: number,
    variant_id: number,
  ): Promise<ProductVariant> {
    const variant =
      await this.product_variants_repository.find_by_id_in_business(
        variant_id,
        business_id,
      );
    if (!variant) {
      throw new DomainNotFoundException({
        code: 'PRODUCT_VARIANT_NOT_FOUND',
        messageKey: 'inventory.product_variant_not_found',
        details: { variant_id },
      });
    }
    return variant;
  }

  private async build_variant_lifecycle(
    variant: ProductVariant,
  ): Promise<VariantLifecycle> {
    const dependencies = await this.get_variant_dependency_counts(
      variant.business_id,
      variant.id,
    );
    const active_count =
      await this.product_variants_repository.count_active_by_product(
        variant.business_id,
        variant.product_id,
      );

    const reasons: string[] = [];
    if (variant.is_default) {
      reasons.push('default_variant');
    }
    if (variant.is_active && active_count <= 1) {
      reasons.push('last_active_variant');
    }

    for (const [dependency_key, dependency_count] of Object.entries(
      dependencies,
    )) {
      if (dependency_count > 0) {
        reasons.push(dependency_key);
      }
    }

    return {
      can_delete: reasons.length === 0,
      can_deactivate:
        variant.is_active &&
        !variant.is_default &&
        !(variant.is_active && active_count <= 1),
      can_reactivate: !variant.is_active,
      reasons,
      dependencies,
    };
  }

  private async get_variant_dependency_counts(
    business_id: number,
    variant_id: number,
  ): Promise<VariantDependencyCounts> {
    const [
      inventory_balances,
      inventory_movement_lines,
      inventory_movements,
      inventory_lots,
      product_prices,
      product_serials,
      promotion_items,
      warehouse_stock,
    ] = await Promise.all([
      this.inventory_balances_repository.count_by_variant_in_business(
        business_id,
        variant_id,
      ),
      this.inventory_movement_lines_repository.count_by_variant_in_business(
        business_id,
        variant_id,
      ),
      this.inventory_movements_repository.count_by_variant_in_business(
        business_id,
        variant_id,
      ),
      this.inventory_lots_repository.count_by_variant_in_business(
        business_id,
        variant_id,
      ),
      this.product_prices_repository.count_by_variant_in_business(
        business_id,
        variant_id,
      ),
      this.product_serials_repository.count_by_variant_in_business(
        business_id,
        variant_id,
      ),
      this.promotions_repository.count_items_by_variant(variant_id),
      this.warehouse_stock_repository.count_by_variant_in_business(
        business_id,
        variant_id,
      ),
    ]);

    return {
      inventory_balances,
      inventory_movement_lines,
      inventory_movements,
      inventory_lots,
      product_prices,
      product_serials,
      promotion_items,
      warehouse_stock,
    };
  }

  private apply_variant_rules(variant: ProductVariant): void {
    if (variant.track_lots && !variant.track_inventory) {
      throw new DomainBadRequestException({
        code: 'VARIANT_LOT_TRACKING_REQUIRES_INVENTORY',
        messageKey: 'inventory.variant_lot_tracking_requires_inventory',
      });
    }
    if (variant.track_expiration && !variant.track_lots) {
      throw new DomainBadRequestException({
        code: 'VARIANT_EXPIRATION_REQUIRES_LOTS',
        messageKey: 'inventory.variant_expiration_requires_lots',
      });
    }
    if (!variant.track_inventory) {
      variant.track_lots = false;
      variant.track_expiration = false;
      variant.allow_negative_stock = false;
    }
  }

  private normalize_optional_string(value?: string | null): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }

  private build_default_variant_sku(product_id: number): string {
    return `SKU-${product_id.toString().padStart(6, '0')}`;
  }
}
