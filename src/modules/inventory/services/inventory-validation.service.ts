import { Injectable } from '@nestjs/common';
import { BranchAccessPolicy } from '../../branches/policies/branch-access.policy';
import { BranchesRepository } from '../../branches/repositories/branches.repository';
import { ContactType } from '../../contacts/enums/contact-type.enum';
import { ContactsRepository } from '../../contacts/repositories/contacts.repository';
import { DomainBadRequestException } from '../../common/errors/exceptions/domain-bad-request.exception';
import { DomainNotFoundException } from '../../common/errors/exceptions/domain-not-found.exception';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import {
  resolve_effective_branch_scope_ids,
  resolve_effective_business_id,
} from '../../common/utils/tenant-context.util';
import { ProductType } from '../enums/product-type.enum';
import { Brand } from '../entities/brand.entity';
import { InventoryLot } from '../entities/inventory-lot.entity';
import { MeasurementUnit } from '../entities/measurement-unit.entity';
import { PriceList } from '../entities/price-list.entity';
import { ProductCategory } from '../entities/product-category.entity';
import { Product } from '../entities/product.entity';
import { TaxProfile } from '../entities/tax-profile.entity';
import { TaxProfileItemKind } from '../enums/tax-profile-item-kind.enum';
import { WarehouseLocation } from '../entities/warehouse-location.entity';
import { Warehouse } from '../entities/warehouse.entity';
import { WarrantyProfile } from '../entities/warranty-profile.entity';
import { BrandsRepository } from '../repositories/brands.repository';
import { InventoryLotsRepository } from '../repositories/inventory-lots.repository';
import { MeasurementUnitsRepository } from '../repositories/measurement-units.repository';
import { PriceListsRepository } from '../repositories/price-lists.repository';
import { ProductCategoriesRepository } from '../repositories/product-categories.repository';
import { ProductsRepository } from '../repositories/products.repository';
import { TaxProfilesRepository } from '../repositories/tax-profiles.repository';
import { WarehouseLocationsRepository } from '../repositories/warehouse-locations.repository';
import { WarehousesRepository } from '../repositories/warehouses.repository';
import { WarrantyProfilesRepository } from '../repositories/warranty-profiles.repository';

@Injectable()
export class InventoryValidationService {
  constructor(
    private readonly branches_repository: BranchesRepository,
    private readonly branch_access_policy: BranchAccessPolicy,
    private readonly contacts_repository: ContactsRepository,
    private readonly product_categories_repository: ProductCategoriesRepository,
    private readonly brands_repository: BrandsRepository,
    private readonly measurement_units_repository: MeasurementUnitsRepository,
    private readonly tax_profiles_repository: TaxProfilesRepository,
    private readonly warranty_profiles_repository: WarrantyProfilesRepository,
    private readonly products_repository: ProductsRepository,
    private readonly price_lists_repository: PriceListsRepository,
    private readonly warehouses_repository: WarehousesRepository,
    private readonly warehouse_locations_repository: WarehouseLocationsRepository,
    private readonly inventory_lots_repository: InventoryLotsRepository,
  ) {}

  resolve_accessible_branch_ids(
    current_user: AuthenticatedUserContext,
  ): number[] | undefined {
    return resolve_effective_branch_scope_ids(current_user);
  }

  async get_branch_for_operation(
    current_user: AuthenticatedUserContext,
    branch_id: number,
  ) {
    const branch = await this.branches_repository.find_by_id_in_business(
      branch_id,
      resolve_effective_business_id(current_user),
    );
    if (!branch) {
      throw new DomainNotFoundException({
        code: 'BRANCH_NOT_FOUND',
        messageKey: 'branches.not_found',
        details: {
          branch_id,
        },
      });
    }

    this.branch_access_policy.assert_can_access_branch(current_user, branch.id);
    return branch;
  }

  async get_category_in_business(
    business_id: number,
    category_id: number,
  ): Promise<ProductCategory> {
    const category =
      await this.product_categories_repository.find_by_id_in_business(
        category_id,
        business_id,
      );
    if (!category) {
      throw new DomainNotFoundException({
        code: 'CATEGORY_NOT_FOUND',
        messageKey: 'inventory.category_not_found',
        details: {
          category_id,
        },
      });
    }

    return category;
  }

  async get_brand_in_business(
    business_id: number,
    brand_id: number,
  ): Promise<Brand> {
    const brand = await this.brands_repository.find_by_id_in_business(
      brand_id,
      business_id,
    );
    if (!brand) {
      throw new DomainNotFoundException({
        code: 'BRAND_NOT_FOUND',
        messageKey: 'inventory.brand_not_found',
        details: {
          brand_id,
        },
      });
    }

    return brand;
  }

  async get_measurement_unit_in_business(
    business_id: number,
    measurement_unit_id: number,
  ): Promise<MeasurementUnit> {
    const measurement_unit =
      await this.measurement_units_repository.find_by_id_in_business(
        measurement_unit_id,
        business_id,
      );
    if (!measurement_unit) {
      throw new DomainNotFoundException({
        code: 'MEASUREMENT_UNIT_NOT_FOUND',
        messageKey: 'inventory.measurement_unit_not_found',
        details: {
          measurement_unit_id,
        },
      });
    }

    return measurement_unit;
  }

  async get_tax_profile_in_business(
    business_id: number,
    tax_profile_id: number,
  ): Promise<TaxProfile> {
    const tax_profile =
      await this.tax_profiles_repository.find_by_id_in_business(
        tax_profile_id,
        business_id,
      );
    if (!tax_profile) {
      throw new DomainNotFoundException({
        code: 'TAX_PROFILE_NOT_FOUND',
        messageKey: 'inventory.tax_profile_not_found',
        details: {
          tax_profile_id,
        },
      });
    }

    return tax_profile;
  }

  async get_warranty_profile_in_business(
    business_id: number,
    warranty_profile_id: number,
  ): Promise<WarrantyProfile> {
    const warranty_profile =
      await this.warranty_profiles_repository.find_by_id_in_business(
        warranty_profile_id,
        business_id,
      );
    if (!warranty_profile) {
      throw new DomainNotFoundException({
        code: 'WARRANTY_PROFILE_NOT_FOUND',
        messageKey: 'inventory.warranty_profile_not_found',
        details: {
          warranty_profile_id,
        },
      });
    }

    return warranty_profile;
  }

  async get_product_in_business(
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

  async get_price_list_in_business(
    business_id: number,
    price_list_id: number,
  ): Promise<PriceList> {
    const price_list = await this.price_lists_repository.find_by_id_in_business(
      price_list_id,
      business_id,
    );
    if (!price_list) {
      throw new DomainNotFoundException({
        code: 'PRICE_LIST_NOT_FOUND',
        messageKey: 'inventory.price_list_not_found',
        details: {
          price_list_id,
        },
      });
    }

    return price_list;
  }

  async get_warehouse_for_operation(
    current_user: AuthenticatedUserContext,
    warehouse_id: number,
  ): Promise<Warehouse> {
    const warehouse = await this.warehouses_repository.find_by_id_in_business(
      warehouse_id,
      resolve_effective_business_id(current_user),
    );
    if (!warehouse) {
      throw new DomainNotFoundException({
        code: 'WAREHOUSE_NOT_FOUND',
        messageKey: 'inventory.warehouse_not_found',
        details: {
          warehouse_id,
        },
      });
    }

    const accessible_branch_ids = [
      warehouse.branch_id,
      ...(warehouse.branch_links
        ?.filter((branch_link) => branch_link.is_active)
        .map((branch_link) => branch_link.branch_id) ?? []),
    ];
    this.branch_access_policy.assert_can_access_any_branch(
      current_user,
      Array.from(new Set(accessible_branch_ids)),
    );
    return warehouse;
  }

  async get_location_for_operation(
    current_user: AuthenticatedUserContext,
    location_id: number,
  ): Promise<WarehouseLocation> {
    const location =
      await this.warehouse_locations_repository.find_by_id_in_business(
        location_id,
        resolve_effective_business_id(current_user),
      );
    if (!location) {
      throw new DomainNotFoundException({
        code: 'WAREHOUSE_LOCATION_NOT_FOUND',
        messageKey: 'inventory.warehouse_location_not_found',
        details: {
          location_id,
        },
      });
    }

    this.branch_access_policy.assert_can_access_branch(
      current_user,
      location.branch_id,
    );
    return location;
  }

  async get_inventory_lot_for_operation(
    current_user: AuthenticatedUserContext,
    inventory_lot_id: number,
  ): Promise<InventoryLot> {
    const inventory_lot =
      await this.inventory_lots_repository.find_by_id_in_business(
        inventory_lot_id,
        resolve_effective_business_id(current_user),
      );
    if (!inventory_lot) {
      throw new DomainNotFoundException({
        code: 'INVENTORY_LOT_NOT_FOUND',
        messageKey: 'inventory.inventory_lot_not_found',
        details: {
          inventory_lot_id,
        },
      });
    }

    this.branch_access_policy.assert_can_access_branch(
      current_user,
      inventory_lot.branch_id,
    );
    return inventory_lot;
  }

  async assert_supplier_contact_in_business(
    business_id: number,
    contact_id: number,
  ) {
    const contact = await this.contacts_repository.find_by_id_in_business(
      contact_id,
      business_id,
    );
    if (!contact) {
      throw new DomainNotFoundException({
        code: 'SUPPLIER_CONTACT_NOT_FOUND',
        messageKey: 'inventory.supplier_contact_not_found',
        details: {
          contact_id,
        },
      });
    }

    if (
      contact.type !== ContactType.SUPPLIER &&
      contact.type !== ContactType.BOTH
    ) {
      throw new DomainBadRequestException({
        code: 'SUPPLIER_CONTACT_TYPE_INVALID',
        messageKey: 'inventory.supplier_contact_type_invalid',
        details: {
          contact_id,
        },
      });
    }

    return contact;
  }

  assert_location_belongs_to_warehouse(
    location: WarehouseLocation,
    warehouse_id: number,
  ): void {
    if (location.warehouse_id !== warehouse_id) {
      throw new DomainBadRequestException({
        code: 'WAREHOUSE_LOCATION_MISMATCH',
        messageKey: 'inventory.warehouse_location_mismatch',
        details: {
          warehouse_id,
          location_id: location.id,
        },
      });
    }
  }

  assert_product_tax_profile_compatibility(
    product_type: ProductType,
    tax_profile: TaxProfile,
  ): void {
    if (
      product_type === ProductType.PRODUCT &&
      tax_profile.item_kind !== TaxProfileItemKind.GOODS
    ) {
      throw new DomainBadRequestException({
        code: 'PRODUCT_TAX_PROFILE_ITEM_KIND_INVALID',
        messageKey: 'inventory.product_tax_profile_goods_required',
        details: {
          tax_profile_id: tax_profile.id,
        },
      });
    }

    if (
      product_type === ProductType.SERVICE &&
      tax_profile.item_kind !== TaxProfileItemKind.SERVICE
    ) {
      throw new DomainBadRequestException({
        code: 'PRODUCT_TAX_PROFILE_ITEM_KIND_INVALID',
        messageKey: 'inventory.product_tax_profile_service_required',
        details: {
          tax_profile_id: tax_profile.id,
        },
      });
    }
  }

  assert_product_is_inventory_enabled(product: Product): void {
    if (
      product.type === ProductType.SERVICE ||
      product.track_inventory === false
    ) {
      throw new DomainBadRequestException({
        code: 'PRODUCT_INVENTORY_TRACKING_REQUIRED',
        messageKey: 'inventory.product_inventory_tracking_required',
        details: {
          product_id: product.id,
        },
      });
    }
  }
}
