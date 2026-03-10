import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BranchAccessPolicy } from '../../branches/policies/branch-access.policy';
import { BranchesRepository } from '../../branches/repositories/branches.repository';
import { ContactType } from '../../contacts/enums/contact-type.enum';
import { ContactsRepository } from '../../contacts/repositories/contacts.repository';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
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
    return this.branch_access_policy.is_owner(current_user)
      ? undefined
      : current_user.branch_ids;
  }

  async get_branch_for_operation(
    current_user: AuthenticatedUserContext,
    branch_id: number,
  ) {
    const branch = await this.branches_repository.find_by_id_in_business(
      branch_id,
      current_user.business_id,
    );
    if (!branch) {
      throw new NotFoundException('Branch not found.');
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
      throw new NotFoundException('Product category not found.');
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
      throw new NotFoundException('Brand not found.');
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
      throw new NotFoundException('Measurement unit not found.');
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
      throw new NotFoundException('Tax profile not found.');
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
      throw new NotFoundException('Warranty profile not found.');
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
      throw new NotFoundException('Product not found.');
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
      throw new NotFoundException('Price list not found.');
    }

    return price_list;
  }

  async get_warehouse_for_operation(
    current_user: AuthenticatedUserContext,
    warehouse_id: number,
  ): Promise<Warehouse> {
    const warehouse = await this.warehouses_repository.find_by_id_in_business(
      warehouse_id,
      current_user.business_id,
    );
    if (!warehouse) {
      throw new NotFoundException('Warehouse not found.');
    }

    this.branch_access_policy.assert_can_access_branch(
      current_user,
      warehouse.branch_id,
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
        current_user.business_id,
      );
    if (!location) {
      throw new NotFoundException('Warehouse location not found.');
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
        current_user.business_id,
      );
    if (!inventory_lot) {
      throw new NotFoundException('Inventory lot not found.');
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
      throw new NotFoundException('Supplier contact not found.');
    }

    if (
      contact.type !== ContactType.SUPPLIER &&
      contact.type !== ContactType.BOTH
    ) {
      throw new BadRequestException(
        'The selected contact is not a supplier-enabled contact.',
      );
    }

    return contact;
  }

  assert_location_belongs_to_warehouse(
    location: WarehouseLocation,
    warehouse_id: number,
  ): void {
    if (location.warehouse_id !== warehouse_id) {
      throw new BadRequestException(
        'The warehouse location does not belong to the selected warehouse.',
      );
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
      throw new BadRequestException(
        'Goods products require a goods tax profile.',
      );
    }

    if (
      product_type === ProductType.SERVICE &&
      tax_profile.item_kind !== TaxProfileItemKind.SERVICE
    ) {
      throw new BadRequestException(
        'Service items require a service tax profile.',
      );
    }
  }

  assert_product_is_inventory_enabled(product: Product): void {
    if (
      product.type === ProductType.SERVICE ||
      product.track_inventory === false
    ) {
      throw new BadRequestException(
        'This product does not support inventory tracking.',
      );
    }
  }
}
