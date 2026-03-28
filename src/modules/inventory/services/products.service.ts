import { Injectable } from '@nestjs/common';
import { CursorQueryDto } from '../../common/dto/cursor-query.dto';
import { CursorResponseDto } from '../../common/dto/cursor-response.dto';
import { PaginatedQueryDto } from '../../common/dto/paginated-query.dto';
import { DomainBadRequestException } from '../../common/errors/exceptions/domain-bad-request.exception';
import { DomainConflictException } from '../../common/errors/exceptions/domain-conflict.exception';
import { DomainNotFoundException } from '../../common/errors/exceptions/domain-not-found.exception';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { EntityCodeService } from '../../common/services/entity-code.service';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { ProductView } from '../contracts/product.view';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { Product } from '../entities/product.entity';
import { ProductType } from '../enums/product-type.enum';
import { ProductSerialsRepository } from '../repositories/product-serials.repository';
import { ProductVariantsRepository } from '../repositories/product-variants.repository';
import { ProductsRepository } from '../repositories/products.repository';
import { ProductSerializer } from '../serializers/product.serializer';
import { InventoryValidationService } from './inventory-validation.service';
import { ProductVariantsService } from './product-variants.service';
import { GetProductsCursorQueryUseCase } from '../use-cases/get-products-cursor.query.use-case';

@Injectable()
export class ProductsService {
  constructor(
    private readonly products_repository: ProductsRepository,
    private readonly inventory_validation_service: InventoryValidationService,
    private readonly entity_code_service: EntityCodeService,
    private readonly product_variants_service: ProductVariantsService,
    private readonly product_variants_repository: ProductVariantsRepository,
    private readonly product_serials_repository: ProductSerialsRepository,
    private readonly product_serializer: ProductSerializer,
    private readonly get_products_cursor_query_use_case: GetProductsCursorQueryUseCase,
  ) {}

  async get_products(current_user: AuthenticatedUserContext) {
    const business_id = resolve_effective_business_id(current_user);
    const products =
      await this.products_repository.find_all_by_business(business_id);
    return products.map((product) => this.serialize_product(product));
  }

  async get_products_paginated(
    current_user: AuthenticatedUserContext,
    query: PaginatedQueryDto,
  ) {
    const business_id = resolve_effective_business_id(current_user);
    return this.products_repository.find_paginated_by_business(
      business_id,
      query,
      (product) => this.serialize_product(product),
    );
  }

  async get_products_cursor(
    current_user: AuthenticatedUserContext,
    query: CursorQueryDto,
  ): Promise<CursorResponseDto<ProductView>> {
    return this.get_products_cursor_query_use_case.execute({
      current_user,
      query,
    }) as Promise<CursorResponseDto<ProductView>>;
  }

  async create_product(
    current_user: AuthenticatedUserContext,
    dto: CreateProductDto,
  ) {
    const business_id = resolve_effective_business_id(current_user);
    const normalized_sku = this.normalize_optional_string(dto.sku);
    const normalized_barcode = this.normalize_optional_string(dto.barcode);
    if (
      normalized_sku &&
      (await this.products_repository.exists_sku_in_business(
        business_id,
        normalized_sku,
      ))
    ) {
      throw new DomainConflictException({
        code: 'PRODUCT_SKU_DUPLICATE',
        messageKey: 'inventory.product_sku_duplicate',
        details: {
          field: 'sku',
        },
      });
    }

    if (
      normalized_barcode &&
      (await this.products_repository.exists_barcode_in_business(
        business_id,
        normalized_barcode,
      ))
    ) {
      throw new DomainConflictException({
        code: 'PRODUCT_BARCODE_DUPLICATE',
        messageKey: 'inventory.product_barcode_duplicate',
        details: {
          field: 'barcode',
        },
      });
    }

    if (dto.code) {
      this.entity_code_service.validate_code('PD', dto.code);
    }

    const tax_profile =
      await this.inventory_validation_service.get_tax_profile_in_business(
        business_id,
        dto.tax_profile_id,
        {
          require_active: true,
        },
      );
    this.inventory_validation_service.assert_product_tax_profile_compatibility(
      dto.type,
      tax_profile,
    );

    const category =
      dto.category_id !== undefined && dto.category_id !== null
        ? await this.inventory_validation_service.get_category_in_business(
            business_id,
            dto.category_id,
            {
              require_active: true,
            },
          )
        : null;
    const brand =
      dto.brand_id !== undefined && dto.brand_id !== null
        ? await this.inventory_validation_service.get_brand_in_business(
            business_id,
            dto.brand_id,
            {
              require_active: true,
            },
          )
        : null;
    const stock_unit =
      dto.stock_unit_id !== undefined && dto.stock_unit_id !== null
        ? await this.inventory_validation_service.get_measurement_unit_in_business(
            business_id,
            dto.stock_unit_id,
            {
              require_active: true,
            },
          )
        : null;
    const sale_unit =
      dto.sale_unit_id !== undefined && dto.sale_unit_id !== null
        ? await this.inventory_validation_service.get_measurement_unit_in_business(
            business_id,
            dto.sale_unit_id,
            {
              require_active: true,
            },
          )
        : null;
    const warranty_profile =
      dto.warranty_profile_id !== undefined && dto.warranty_profile_id !== null
        ? await this.inventory_validation_service.get_warranty_profile_in_business(
            business_id,
            dto.warranty_profile_id,
            {
              require_active: true,
            },
          )
        : null;

    const stock_unit_id = stock_unit?.id ?? sale_unit?.id ?? null;
    const sale_unit_id = sale_unit?.id ?? stock_unit?.id ?? null;

    const product = this.products_repository.create({
      business_id,
      code: dto.code?.trim() ?? null,
      type: dto.type,
      name: dto.name.trim(),
      description: this.normalize_optional_string(dto.description),
      category_id: category?.id ?? null,
      brand_id: brand?.id ?? null,
      sku: normalized_sku,
      barcode: normalized_barcode,
      stock_unit_id,
      sale_unit_id,
      tax_profile_id: tax_profile.id,
      track_inventory: dto.track_inventory ?? true,
      track_lots: dto.track_lots ?? false,
      track_expiration: dto.track_expiration ?? false,
      track_serials: dto.track_serials ?? false,
      allow_negative_stock: dto.allow_negative_stock ?? false,
      has_variants: dto.has_variants ?? false,
      has_warranty: dto.has_warranty ?? false,
      warranty_profile_id: warranty_profile?.id ?? null,
      is_active: dto.is_active ?? true,
    });

    this.apply_product_rules(product);
    const saved_product = await this.products_repository.save(product);
    await this.product_variants_service.ensure_default_variant_for_product(
      saved_product,
    );
    return this.serialize_product(
      await this.get_product_entity(business_id, saved_product.id),
    );
  }

  async get_product(
    current_user: AuthenticatedUserContext,
    product_id: number,
  ) {
    return this.serialize_product(
      await this.get_product_entity(
        resolve_effective_business_id(current_user),
        product_id,
      ),
    );
  }

  async update_product(
    current_user: AuthenticatedUserContext,
    product_id: number,
    dto: UpdateProductDto,
  ) {
    const business_id = resolve_effective_business_id(current_user);
    const product = await this.get_product_entity(business_id, product_id);

    const next_sku =
      dto.sku !== undefined
        ? this.normalize_optional_string(dto.sku)
        : product.sku;
    const next_barcode =
      dto.barcode !== undefined
        ? this.normalize_optional_string(dto.barcode)
        : product.barcode;

    if (
      next_sku &&
      (await this.products_repository.exists_sku_in_business(
        business_id,
        next_sku,
        product.id,
      ))
    ) {
      throw new DomainConflictException({
        code: 'PRODUCT_SKU_DUPLICATE',
        messageKey: 'inventory.product_sku_duplicate',
        details: {
          field: 'sku',
        },
      });
    }

    if (
      next_barcode &&
      (await this.products_repository.exists_barcode_in_business(
        business_id,
        next_barcode,
        product.id,
      ))
    ) {
      throw new DomainConflictException({
        code: 'PRODUCT_BARCODE_DUPLICATE',
        messageKey: 'inventory.product_barcode_duplicate',
        details: {
          field: 'barcode',
        },
      });
    }

    const next_type = dto.type ?? product.type;
    const tax_profile =
      dto.tax_profile_id !== undefined
        ? await this.inventory_validation_service.get_tax_profile_in_business(
            business_id,
            dto.tax_profile_id,
            {
              require_active: true,
            },
          )
        : product.tax_profile;
    if (!tax_profile) {
      throw new DomainNotFoundException({
        code: 'TAX_PROFILE_NOT_FOUND',
        messageKey: 'inventory.tax_profile_not_found',
        details: {
          tax_profile_id: dto.tax_profile_id ?? null,
        },
      });
    }

    this.inventory_validation_service.assert_product_tax_profile_compatibility(
      next_type,
      tax_profile,
    );

    if (dto.category_id !== undefined) {
      product.category_id =
        dto.category_id === null
          ? null
          : (
              await this.inventory_validation_service.get_category_in_business(
                business_id,
                dto.category_id,
                {
                  require_active: true,
                },
              )
            ).id;
    }
    if (dto.brand_id !== undefined) {
      product.brand_id =
        dto.brand_id === null
          ? null
          : (
              await this.inventory_validation_service.get_brand_in_business(
                business_id,
                dto.brand_id,
                {
                  require_active: true,
                },
              )
            ).id;
    }
    if (dto.stock_unit_id !== undefined) {
      product.stock_unit_id =
        dto.stock_unit_id === null
          ? null
          : (
              await this.inventory_validation_service.get_measurement_unit_in_business(
                business_id,
                dto.stock_unit_id,
                {
                  require_active: true,
                },
              )
            ).id;
    }
    if (dto.sale_unit_id !== undefined) {
      product.sale_unit_id =
        dto.sale_unit_id === null
          ? null
          : (
              await this.inventory_validation_service.get_measurement_unit_in_business(
                business_id,
                dto.sale_unit_id,
                {
                  require_active: true,
                },
              )
            ).id;
    }
    if (dto.warranty_profile_id !== undefined) {
      product.warranty_profile_id =
        dto.warranty_profile_id === null
          ? null
          : (
              await this.inventory_validation_service.get_warranty_profile_in_business(
                business_id,
                dto.warranty_profile_id,
                {
                  require_active: true,
                },
              )
            ).id;
    }

    if (dto.code !== undefined) {
      if (dto.code !== null) {
        this.entity_code_service.validate_code('PD', dto.code.trim());
      }
      product.code = dto.code?.trim() ?? null;
    }
    if (dto.type) {
      product.type = dto.type;
    }
    if (dto.name) {
      product.name = dto.name.trim();
    }
    if (dto.description !== undefined) {
      product.description = this.normalize_optional_string(dto.description);
    }
    if (dto.sku !== undefined) {
      product.sku = next_sku;
    }
    if (dto.barcode !== undefined) {
      product.barcode = next_barcode;
    }
    if (dto.tax_profile_id !== undefined) {
      product.tax_profile_id = tax_profile.id;
    }
    if (dto.track_inventory !== undefined) {
      product.track_inventory = dto.track_inventory;
    }
    if (dto.track_lots !== undefined) {
      product.track_lots = dto.track_lots;
    }
    if (dto.track_expiration !== undefined) {
      product.track_expiration = dto.track_expiration;
    }
    if (dto.track_serials !== undefined) {
      product.track_serials = dto.track_serials;
    }
    if (dto.allow_negative_stock !== undefined) {
      product.allow_negative_stock = dto.allow_negative_stock;
    }
    if (dto.has_variants !== undefined) {
      if (dto.has_variants === false) {
        const non_default_count =
          await this.product_variants_service.count_non_default_variants(
            business_id,
            product.id,
          );
        if (non_default_count > 0) {
          throw new DomainBadRequestException({
            code: 'PRODUCT_HAS_NON_DEFAULT_VARIANTS',
            messageKey: 'inventory.product_has_non_default_variants',
            details: { product_id: product.id, non_default_count },
          });
        }
      }
      if (dto.has_variants === true && !product.has_variants) {
        const default_variant =
          await this.product_variants_repository.find_default_by_product_in_business(
            business_id,
            product.id,
          );
        if (default_variant) {
          const serial_count =
            await this.product_serials_repository.count_by_variant_in_business(
              business_id,
              default_variant.id,
            );
          if (serial_count > 0) {
            throw new DomainBadRequestException({
              code: 'HAS_VARIANTS_REQUIRES_NO_SERIALS',
              messageKey:
                'inventory.has_variants_requires_no_serials',
              details: {
                product_id: product.id,
                default_variant_id: default_variant.id,
                serial_count,
              },
            });
          }
        }
      }
      product.has_variants = dto.has_variants;
    }
    if (dto.has_warranty !== undefined) {
      product.has_warranty = dto.has_warranty;
    }
    if (dto.is_active !== undefined) {
      product.is_active = dto.is_active;
    }

    this.apply_product_rules(product);
    const saved_product = await this.products_repository.save(product);
    await this.product_variants_service.ensure_default_variant_for_product(
      saved_product,
    );
    return this.serialize_product(
      await this.get_product_entity(business_id, saved_product.id),
    );
  }

  async deactivate_product(
    current_user: AuthenticatedUserContext,
    product_id: number,
  ) {
    const business_id = resolve_effective_business_id(current_user);
    const product = await this.get_product_entity(business_id, product_id);
    product.is_active = false;
    const saved = await this.products_repository.save(product);
    await this.product_variants_service.ensure_default_variant_for_product(
      saved,
    );
    return this.serialize_product(
      await this.get_product_entity(business_id, product_id),
    );
  }

  private async get_product_entity(
    business_id: number,
    product_id: number,
  ): Promise<Product> {
    const product = await this.products_repository.find_by_id_in_business(
      product_id,
      business_id,
    );
    if (!product) {
      throw new DomainNotFoundException({
        code: 'PRODUCT_NOT_FOUND',
        messageKey: 'inventory.product_not_found',
        details: {
          product_id,
        },
      });
    }

    return product;
  }

  private apply_product_rules(product: Product): void {
    if (product.type === ProductType.SERVICE) {
      product.track_inventory = false;
      product.track_lots = false;
      product.track_expiration = false;
      product.track_serials = false;
      product.allow_negative_stock = false;
    } else {
      if (product.track_lots && !product.track_inventory) {
        throw new DomainBadRequestException({
          code: 'PRODUCT_LOT_TRACKING_REQUIRES_INVENTORY',
          messageKey: 'inventory.product_lot_tracking_requires_inventory',
        });
      }

      if (product.track_expiration && !product.track_lots) {
        throw new DomainBadRequestException({
          code: 'PRODUCT_EXPIRATION_REQUIRES_LOTS',
          messageKey: 'inventory.product_expiration_requires_lots',
        });
      }

      if (!product.track_inventory) {
        product.track_lots = false;
        product.track_expiration = false;
        product.track_serials = false;
        product.allow_negative_stock = false;
      }
    }

    if (!product.has_warranty) {
      product.warranty_profile_id = null;
    }

    if (product.has_warranty && !product.warranty_profile_id) {
      throw new DomainBadRequestException({
        code: 'PRODUCT_WARRANTY_PROFILE_REQUIRED',
        messageKey: 'inventory.product_warranty_profile_required',
      });
    }

    const next_stock_unit_id = product.stock_unit_id ?? product.sale_unit_id;
    const next_sale_unit_id = product.sale_unit_id ?? product.stock_unit_id;

    if (
      next_stock_unit_id !== null &&
      next_sale_unit_id !== null &&
      next_stock_unit_id !== next_sale_unit_id
    ) {
      throw new DomainBadRequestException({
        code: 'PRODUCT_UNIT_CONVERSION_NOT_SUPPORTED',
        messageKey: 'inventory.product_unit_conversion_not_supported',
      });
    }

    product.stock_unit_id = next_stock_unit_id;
    product.sale_unit_id = next_sale_unit_id;
  }

  private normalize_optional_string(value?: string | null): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }

  serialize_product_view(product: Product): ProductView {
    return this.product_serializer.serialize(product);
  }

  private serialize_product(product: Product): ProductView {
    return this.serialize_product_view(product);
  }
}
