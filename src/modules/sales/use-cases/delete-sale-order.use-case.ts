import { Injectable } from '@nestjs/common';
import { CommandUseCase } from '../../common/application/interfaces/command-use-case.interface';
import { DomainBadRequestException } from '../../common/errors/exceptions/domain-bad-request.exception';
import { DomainNotFoundException } from '../../common/errors/exceptions/domain-not-found.exception';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { InventoryReservationsService } from '../../inventory/services/inventory-reservations.service';
import { SaleOrderAccessPolicy } from '../policies/sale-order-access.policy';
import { SaleOrderLifecyclePolicy } from '../policies/sale-order-lifecycle.policy';
import { ElectronicDocumentsRepository } from '../repositories/electronic-documents.repository';
import { SaleOrdersRepository } from '../repositories/sale-orders.repository';

export type DeleteSaleOrderCommand = {
  current_user: AuthenticatedUserContext;
  order_id: number;
};

export type DeleteSaleOrderResult = {
  id: number;
  deleted: true;
};

@Injectable()
export class DeleteSaleOrderUseCase
  implements CommandUseCase<DeleteSaleOrderCommand, DeleteSaleOrderResult>
{
  constructor(
    private readonly sale_orders_repository: SaleOrdersRepository,
    private readonly electronic_documents_repository: ElectronicDocumentsRepository,
    private readonly inventory_reservations_service: InventoryReservationsService,
    private readonly sale_order_access_policy: SaleOrderAccessPolicy,
    private readonly sale_order_lifecycle_policy: SaleOrderLifecyclePolicy,
  ) {}

  async execute({
    current_user,
    order_id,
  }: DeleteSaleOrderCommand): Promise<DeleteSaleOrderResult> {
    const business_id = resolve_effective_business_id(current_user);
    const order = await this.sale_orders_repository.find_by_id_in_business(
      order_id,
      business_id,
    );
    if (!order) {
      throw new DomainNotFoundException({
        code: 'SALE_ORDER_NOT_FOUND',
        messageKey: 'sales.order_not_found',
        details: { order_id },
      });
    }

    this.sale_order_access_policy.assert_can_access_order(current_user, order);
    this.sale_order_lifecycle_policy.assert_deletable(order, order_id);

    const electronic_documents =
      await this.electronic_documents_repository.find_by_sale_order_id(
        order_id,
        business_id,
      );
    const reservation_count =
      await this.inventory_reservations_service.count_by_sale_order_id(
        business_id,
        order_id,
      );
    if (electronic_documents.length > 0 || reservation_count > 0) {
      throw new DomainBadRequestException({
        code: 'SALE_ORDER_DELETE_FORBIDDEN',
        messageKey: 'sales.order_delete_forbidden',
        details: {
          order_id,
          dependencies: {
            electronic_documents: electronic_documents.length,
            inventory_reservations: reservation_count,
          },
        },
      });
    }

    // Clean up inactive reservations (released/consumed) before deleting
    // so the FK constraint doesn't block the delete.
    // Active reservations were already checked above and would have thrown.
    await this.inventory_reservations_service.delete_inactive_by_sale_order_id(
      business_id,
      order_id,
    );

    await this.sale_orders_repository.remove(order);
    return { id: order_id, deleted: true };
  }
}
