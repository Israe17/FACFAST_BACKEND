import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { EntityCodeService } from '../../common/services/entity-code.service';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { Product } from '../entities/product.entity';
import { ProductType } from '../enums/product-type.enum';
import { ProductsRepository } from '../repositories/products.repository';
import { InventoryValidationService } from './inventory-validation.service';

@Injectable()
export class ProductsService {
  constructor(
    private readonly products_repository: ProductsRepository,
    private readonly inventory_validation_service: InventoryValidationService,
    private readonly entity_code_service: EntityCodeService,
  ) {}

  async get_products(current_user: AuthenticatedUserContext) {
    const products = await this.products_repository.find_all_by_business(
      current_user.business_id,
    );
    return products.map((product) => this.serialize_product(product));
  }

  async create_product(
    current_user: AuthenticatedUserContext,
    dto: CreateProductDto,
  ) {
    const normalized_sku = this.normalize_optional_string(dto.sku);
    const normalized_barcode = this.normalize_optional_string(dto.barcode);
    if (
      normalized_sku &&
      (await this.products_repository.exists_sku_in_business(
        current_user.business_id,
        normalized_sku,
      ))
    ) {
      throw new ConflictException('A product with this SKU already exists.');
    }

    if (
      normalized_barcode &&
      (await this.products_repository.exists_barcode_in_business(
        current_user.business_id,
        normalized_barcode,
      ))
    ) {
      throw new ConflictException(
        'A product with this barcode already exists.',
      );
    }

    if (dto.code) {
      this.entity_code_service.validate_code('PD', dto.code);
    }

    const tax_profile =
      await this.inventory_validation_service.get_tax_profile_in_business(
        current_user.business_id,
        dto.tax_profile_id,
      );
    this.inventory_validation_service.assert_product_tax_profile_compatibility(
      dto.type,
      tax_profile,
    );

    const category =
      dto.category_id !== undefined && dto.category_id !== null
        ? await this.inventory_validation_service.get_category_in_business(
            current_user.business_id,
            dto.category_id,
          )
        : null;
    const brand =
      dto.brand_id !== undefined && dto.brand_id !== null
        ? await this.inventory_validation_service.get_brand_in_business(
            current_user.business_id,
            dto.brand_id,
          )
        : null;
    const stock_unit =
      dto.stock_unit_id !== undefined && dto.stock_unit_id !== null
        ? await this.inventory_validation_service.get_measurement_unit_in_business(
            current_user.business_id,
            dto.stock_unit_id,
          )
        : null;
    const sale_unit =
      dto.sale_unit_id !== undefined && dto.sale_unit_id !== null
        ? await this.inventory_validation_service.get_measurement_unit_in_business(
            current_user.business_id,
            dto.sale_unit_id,
          )
        : null;
    const warranty_profile =
      dto.warranty_profile_id !== undefined && dto.warranty_profile_id !== null
        ? await this.inventory_validation_service.get_warranty_profile_in_business(
            current_user.business_id,
            dto.warranty_profile_id,
          )
        : null;

    const product = this.products_repository.create({
      business_id: current_user.business_id,
      code: dto.code?.trim() ?? null,
      type: dto.type,
      name: dto.name.trim(),
      description: this.normalize_optional_string(dto.description),
      category_id: category?.id ?? null,
      brand_id: brand?.id ?? null,
      sku: normalized_sku,
      barcode: normalized_barcode,
      stock_unit_id: stock_unit?.id ?? null,
      sale_unit_id: sale_unit?.id ?? null,
      tax_profile_id: tax_profile.id,
      track_inventory: dto.track_inventory ?? true,
      track_lots: dto.track_lots ?? false,
      track_expiration: dto.track_expiration ?? false,
      allow_negative_stock: dto.allow_negative_stock ?? false,
      has_warranty: dto.has_warranty ?? false,
      warranty_profile_id: warranty_profile?.id ?? null,
      is_active: dto.is_active ?? true,
    });

    this.apply_product_rules(product);
    const saved_product = await this.products_repository.save(product);
    return this.serialize_product(
      await this.get_product_entity(current_user.business_id, saved_product.id),
    );
  }

  async get_product(
    current_user: AuthenticatedUserContext,
    product_id: number,
  ) {
    return this.serialize_product(
      await this.get_product_entity(current_user.business_id, product_id),
    );
  }

  async update_product(
    current_user: AuthenticatedUserContext,
    product_id: number,
    dto: UpdateProductDto,
  ) {
    const product = await this.get_product_entity(
      current_user.business_id,
      product_id,
    );

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
        current_user.business_id,
        next_sku,
        product.id,
      ))
    ) {
      throw new ConflictException('A product with this SKU already exists.');
    }

    if (
      next_barcode &&
      (await this.products_repository.exists_barcode_in_business(
        current_user.business_id,
        next_barcode,
        product.id,
      ))
    ) {
      throw new ConflictException(
        'A product with this barcode already exists.',
      );
    }

    const next_type = dto.type ?? product.type;
    const tax_profile =
      dto.tax_profile_id !== undefined
        ? await this.inventory_validation_service.get_tax_profile_in_business(
            current_user.business_id,
            dto.tax_profile_id,
          )
        : product.tax_profile;
    if (!tax_profile) {
      throw new NotFoundException('Tax profile not found.');
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
                current_user.business_id,
                dto.category_id,
              )
            ).id;
    }
    if (dto.brand_id !== undefined) {
      product.brand_id =
        dto.brand_id === null
          ? null
          : (
              await this.inventory_validation_service.get_brand_in_business(
                current_user.business_id,
                dto.brand_id,
              )
            ).id;
    }
    if (dto.stock_unit_id !== undefined) {
      product.stock_unit_id =
        dto.stock_unit_id === null
          ? null
          : (
              await this.inventory_validation_service.get_measurement_unit_in_business(
                current_user.business_id,
                dto.stock_unit_id,
              )
            ).id;
    }
    if (dto.sale_unit_id !== undefined) {
      product.sale_unit_id =
        dto.sale_unit_id === null
          ? null
          : (
              await this.inventory_validation_service.get_measurement_unit_in_business(
                current_user.business_id,
                dto.sale_unit_id,
              )
            ).id;
    }
    if (dto.warranty_profile_id !== undefined) {
      product.warranty_profile_id =
        dto.warranty_profile_id === null
          ? null
          : (
              await this.inventory_validation_service.get_warranty_profile_in_business(
                current_user.business_id,
                dto.warranty_profile_id,
              )
            ).id;
    }

    if (dto.code) {
      this.entity_code_service.validate_code('PD', dto.code.trim());
      product.code = dto.code.trim();
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
    if (dto.allow_negative_stock !== undefined) {
      product.allow_negative_stock = dto.allow_negative_stock;
    }
    if (dto.has_warranty !== undefined) {
      product.has_warranty = dto.has_warranty;
    }
    if (dto.is_active !== undefined) {
      product.is_active = dto.is_active;
    }

    this.apply_product_rules(product);
    const saved_product = await this.products_repository.save(product);
    return this.serialize_product(
      await this.get_product_entity(current_user.business_id, saved_product.id),
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
      throw new NotFoundException('Product not found.');
    }

    return product;
  }

  private apply_product_rules(product: Product): void {
    if (product.type === ProductType.SERVICE) {
      product.track_inventory = false;
      product.track_lots = false;
      product.track_expiration = false;
      product.allow_negative_stock = false;
    } else {
      if (product.track_lots && !product.track_inventory) {
        throw new BadRequestException(
          'Products with lot tracking must also track inventory.',
        );
      }

      if (product.track_expiration && !product.track_lots) {
        throw new BadRequestException(
          'Products with expiration tracking must also track lots.',
        );
      }

      if (!product.track_inventory) {
        product.track_lots = false;
        product.track_expiration = false;
        product.allow_negative_stock = false;
      }
    }

    if (!product.has_warranty) {
      product.warranty_profile_id = null;
    }

    if (product.has_warranty && !product.warranty_profile_id) {
      throw new BadRequestException(
        'Products with warranty enabled require a warranty profile.',
      );
    }
  }

  private normalize_optional_string(value?: string | null): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }

  private serialize_product(product: Product) {
    return {
      id: product.id,
      code: product.code,
      business_id: product.business_id,
      type: product.type,
      name: product.name,
      description: product.description,
      category: product.category
        ? {
            id: product.category.id,
            code: product.category.code,
            name: product.category.name,
          }
        : null,
      brand: product.brand
        ? {
            id: product.brand.id,
            code: product.brand.code,
            name: product.brand.name,
          }
        : null,
      sku: product.sku,
      barcode: product.barcode,
      stock_unit: product.stock_unit
        ? {
            id: product.stock_unit.id,
            code: product.stock_unit.code,
            name: product.stock_unit.name,
            symbol: product.stock_unit.symbol,
          }
        : null,
      sale_unit: product.sale_unit
        ? {
            id: product.sale_unit.id,
            code: product.sale_unit.code,
            name: product.sale_unit.name,
            symbol: product.sale_unit.symbol,
          }
        : null,
      tax_profile: product.tax_profile
        ? {
            id: product.tax_profile.id,
            code: product.tax_profile.code,
            name: product.tax_profile.name,
            item_kind: product.tax_profile.item_kind,
            tax_type: product.tax_profile.tax_type,
            cabys_code: product.tax_profile.cabys_code,
          }
        : null,
      track_inventory: product.track_inventory,
      track_lots: product.track_lots,
      track_expiration: product.track_expiration,
      allow_negative_stock: product.allow_negative_stock,
      has_warranty: product.has_warranty,
      warranty_profile: product.warranty_profile
        ? {
            id: product.warranty_profile.id,
            code: product.warranty_profile.code,
            name: product.warranty_profile.name,
          }
        : null,
      is_active: product.is_active,
      created_at: product.created_at,
      updated_at: product.updated_at,
    };
  }
}
