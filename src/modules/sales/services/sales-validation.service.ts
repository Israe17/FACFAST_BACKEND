import { Injectable } from '@nestjs/common';
import { ContactType } from '../../contacts/enums/contact-type.enum';
import { ContactsRepository } from '../../contacts/repositories/contacts.repository';
import { DomainBadRequestException } from '../../common/errors/exceptions/domain-bad-request.exception';
import { DomainNotFoundException } from '../../common/errors/exceptions/domain-not-found.exception';
import { UserStatus } from '../../common/enums/user-status.enum';
import { UserType } from '../../common/enums/user-type.enum';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { ProductVariantsRepository } from '../../inventory/repositories/product-variants.repository';
import { DispatchCatalogValidationService } from '../../inventory/services/dispatch-catalog-validation.service';
import { InventoryValidationService } from '../../inventory/services/inventory-validation.service';
import { UsersRepository } from '../../users/repositories/users.repository';

type SaleOrderReferenceValidationInput = {
  branch_id: number;
  customer_contact_id: number;
  seller_user_id?: number | null;
  delivery_zone_id?: number | null;
  warehouse_id?: number | null;
  product_variant_ids?: number[];
};

@Injectable()
export class SalesValidationService {
  constructor(
    private readonly contacts_repository: ContactsRepository,
    private readonly users_repository: UsersRepository,
    private readonly product_variants_repository: ProductVariantsRepository,
    private readonly inventory_validation_service: InventoryValidationService,
    private readonly dispatch_catalog_validation_service: DispatchCatalogValidationService,
  ) {}

  async validate_sale_order_references(
    current_user: AuthenticatedUserContext,
    input: SaleOrderReferenceValidationInput,
  ): Promise<void> {
    const business_id = resolve_effective_business_id(current_user);

    await this.assert_customer_contact_in_business(
      business_id,
      input.customer_contact_id,
    );

    if (input.seller_user_id !== undefined && input.seller_user_id !== null) {
      await this.assert_seller_user_in_business(
        business_id,
        input.branch_id,
        input.seller_user_id,
      );
    }

    if (input.delivery_zone_id !== undefined && input.delivery_zone_id !== null) {
      await this.dispatch_catalog_validation_service.get_zone_for_branch_operation(
        current_user,
        input.delivery_zone_id,
        input.branch_id,
        { require_active: true },
      );
    }

    if (input.warehouse_id !== undefined && input.warehouse_id !== null) {
      await this.dispatch_catalog_validation_service.get_warehouse_for_branch_operation(
        current_user,
        input.warehouse_id,
        input.branch_id,
        { require_active: true },
      );
    }

    await this.assert_product_variants_in_business(
      business_id,
      input.product_variant_ids ?? [],
    );
  }

  private async assert_customer_contact_in_business(
    business_id: number,
    customer_contact_id: number,
  ): Promise<void> {
    const customer_contact = await this.contacts_repository.find_by_id_in_business(
      customer_contact_id,
      business_id,
    );
    if (!customer_contact) {
      throw new DomainNotFoundException({
        code: 'CONTACT_NOT_FOUND',
        messageKey: 'contacts.not_found',
        details: {
          contact_id: customer_contact_id,
        },
      });
    }

    if (!customer_contact.is_active) {
      throw new DomainBadRequestException({
        code: 'SALE_ORDER_CUSTOMER_INACTIVE',
        messageKey: 'sales.order_customer_inactive',
        details: {
          customer_contact_id,
        },
      });
    }

    if (
      customer_contact.type !== ContactType.CUSTOMER &&
      customer_contact.type !== ContactType.BOTH
    ) {
      throw new DomainBadRequestException({
        code: 'SALE_ORDER_CUSTOMER_TYPE_INVALID',
        messageKey: 'sales.order_customer_type_invalid',
        details: {
          customer_contact_id,
          contact_type: customer_contact.type,
        },
      });
    }
  }

  private async assert_product_variants_in_business(
    business_id: number,
    product_variant_ids: number[],
  ): Promise<void> {
    const unique_variant_ids = Array.from(
      new Set(
        product_variant_ids.filter(
          (product_variant_id) => Number.isInteger(product_variant_id),
        ),
      ),
    );

    if (!unique_variant_ids.length) {
      return;
    }

    const product_variants = await Promise.all(
      unique_variant_ids.map((product_variant_id) =>
        this.product_variants_repository.find_by_id_in_business(
          product_variant_id,
          business_id,
        ),
      ),
    );

    for (let index = 0; index < unique_variant_ids.length; index += 1) {
      const product_variant_id = unique_variant_ids[index];
      const product_variant = product_variants[index];
      if (!product_variant || !product_variant.product) {
        throw new DomainNotFoundException({
          code: 'PRODUCT_VARIANT_NOT_FOUND',
          messageKey: 'inventory.product_variant_not_found',
          details: {
            variant_id: product_variant_id,
          },
        });
      }

      this.inventory_validation_service.assert_product_is_active(
        product_variant.product,
      );
      this.inventory_validation_service.assert_variant_is_active(product_variant);
    }
  }

  private async assert_seller_user_in_business(
    business_id: number,
    branch_id: number,
    seller_user_id: number,
  ): Promise<void> {
    const seller = await this.users_repository.find_by_id_in_business(
      seller_user_id,
      business_id,
    );
    if (!seller) {
      throw new DomainNotFoundException({
        code: 'USER_NOT_FOUND',
        messageKey: 'users.not_found',
        details: {
          user_id: seller_user_id,
        },
      });
    }

    if (seller.status !== UserStatus.ACTIVE) {
      throw new DomainBadRequestException({
        code: 'SALE_ORDER_SELLER_INACTIVE',
        messageKey: 'sales.order_seller_inactive',
        details: {
          seller_user_id,
        },
      });
    }

    if (
      seller.is_platform_admin === true ||
      seller.user_type === UserType.OWNER
    ) {
      return;
    }

    const accessible_branch_ids =
      seller.user_branch_access?.map((assignment) => assignment.branch_id) ?? [];
    if (!accessible_branch_ids.length || accessible_branch_ids.includes(branch_id)) {
      return;
    }

    throw new DomainBadRequestException({
      code: 'SALE_ORDER_SELLER_BRANCH_SCOPE_INVALID',
      messageKey: 'sales.order_seller_branch_scope_invalid',
      details: {
        seller_user_id,
        branch_id,
      },
    });
  }
}
