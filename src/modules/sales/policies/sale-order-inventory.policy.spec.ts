import { DomainBadRequestException } from '../../common/errors/exceptions/domain-bad-request.exception';
import { SaleOrderInventoryPolicy } from './sale-order-inventory.policy';

describe('SaleOrderInventoryPolicy', () => {
  it('rejects reservations that exceed available stock when negative stock is disabled', async () => {
    const inventory_ledger_service = {
      assert_warehouse_allowed_for_branch: jest.fn().mockResolvedValue(undefined),
      assert_tenant_consistency: jest.fn(),
    };
    const policy = new SaleOrderInventoryPolicy(
      inventory_ledger_service as never,
    );
    const manager = {
      getRepository: jest.fn().mockReturnValue({
        createQueryBuilder: jest.fn().mockReturnValue({
          setLock: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          getMany: jest.fn().mockResolvedValue([
            {
              product_variant_id: 22,
              on_hand_quantity: 10,
              reserved_quantity: 8,
            },
          ]),
        }),
      }),
    };

    await expect(
      policy.assert_order_can_reserve(manager as never, {
        id: 5,
        business_id: 1,
        branch_id: 3,
        branch: {
          business_id: 1,
        },
        warehouse_id: 7,
        warehouse: {
          id: 7,
          business_id: 1,
        },
        lines: [
          {
            id: 11,
            product_variant_id: 22,
            quantity: 3,
            product_variant: {
              id: 22,
              business_id: 1,
              track_inventory: true,
              allow_negative_stock: false,
            },
          },
        ],
      } as never),
    ).rejects.toThrow(DomainBadRequestException);
  });

  it('aggregates repeated variant lines before checking availability', async () => {
    const inventory_ledger_service = {
      assert_warehouse_allowed_for_branch: jest.fn().mockResolvedValue(undefined),
      assert_tenant_consistency: jest.fn(),
    };
    const policy = new SaleOrderInventoryPolicy(
      inventory_ledger_service as never,
    );
    const getMany = jest.fn().mockResolvedValue([
      {
        product_variant_id: 22,
        on_hand_quantity: 10,
        reserved_quantity: 6,
      },
    ]);
    const manager = {
      getRepository: jest.fn().mockReturnValue({
        createQueryBuilder: jest.fn().mockReturnValue({
          setLock: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          getMany,
        }),
      }),
    };

    await expect(
      policy.assert_order_can_reserve(manager as never, {
        id: 5,
        business_id: 1,
        branch_id: 3,
        branch: {
          business_id: 1,
        },
        warehouse_id: 7,
        warehouse: {
          id: 7,
          business_id: 1,
        },
        lines: [
          {
            id: 11,
            product_variant_id: 22,
            quantity: 2,
            product_variant: {
              id: 22,
              business_id: 1,
              track_inventory: true,
              allow_negative_stock: false,
            },
          },
          {
            id: 12,
            product_variant_id: 22,
            quantity: 3,
            product_variant: {
              id: 22,
              business_id: 1,
              track_inventory: true,
              allow_negative_stock: false,
            },
          },
        ],
      } as never),
    ).rejects.toThrow(DomainBadRequestException);

    expect(getMany).toHaveBeenCalledTimes(1);
  });
});
