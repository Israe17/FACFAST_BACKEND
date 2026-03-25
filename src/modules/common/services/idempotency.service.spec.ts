import { createHash } from 'crypto';
import { DomainConflictException } from '../errors/exceptions/domain-conflict.exception';
import { IdempotencyKeyStatus } from '../enums/idempotency-key-status.enum';
import { IdempotencyKeysRepository } from '../repositories/idempotency-keys.repository';
import { IdempotencyService } from './idempotency.service';

describe('IdempotencyService', () => {
  let service: IdempotencyService;

  const idempotency_keys_repository = {
    find_by_scope: jest.fn(),
    create_processing: jest.fn(),
    mark_completed: jest.fn(),
  } as unknown as jest.Mocked<IdempotencyKeysRepository>;

  const data_source = {
    transaction: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new IdempotencyService(idempotency_keys_repository);
  });

  it('executes the work directly when no idempotency key is provided', async () => {
    data_source.transaction = jest.fn(async (work) =>
      work({ manager: true } as never),
    );

    await expect(
      service.execute(
        data_source as never,
        {
          business_id: 1,
          user_id: 7,
          scope: 'sales.sale_orders.confirm.9',
          request_payload: { order_id: 9 },
        },
        async () => ({ success: true }),
      ),
    ).resolves.toEqual({ success: true });

    expect(idempotency_keys_repository.find_by_scope).not.toHaveBeenCalled();
  });

  it('returns the stored response for a completed key with the same payload', async () => {
    idempotency_keys_repository.find_by_scope.mockResolvedValue({
      id: 1,
      request_hash: build_hash({ order_id: 9 }),
      status: IdempotencyKeyStatus.COMPLETED,
      response_payload: { success: true, order_id: 9 },
      scope: 'sales.sale_orders.confirm.9',
    } as never);

    await expect(
      service.execute(
        data_source as never,
        {
          business_id: 1,
          user_id: 7,
          scope: 'sales.sale_orders.confirm.9',
          idempotency_key: 'confirm-9',
          request_payload: { order_id: 9 },
        },
        async () => ({ success: false }),
      ),
    ).resolves.toEqual({
      success: true,
      order_id: 9,
    });
  });

  it('rejects reusing the same key with a different payload', async () => {
    idempotency_keys_repository.find_by_scope.mockResolvedValue({
      id: 1,
      request_hash: build_hash({ order_id: 9 }),
      status: IdempotencyKeyStatus.COMPLETED,
      response_payload: { success: true, order_id: 9 },
      scope: 'sales.sale_orders.confirm.9',
    } as never);

    await expect(
      service.execute(
        data_source as never,
        {
          business_id: 1,
          user_id: 7,
          scope: 'sales.sale_orders.confirm.9',
          idempotency_key: 'confirm-9',
          request_payload: { order_id: 10 },
        },
        async () => ({ success: false }),
      ),
    ).rejects.toBeInstanceOf(DomainConflictException);
  });

  it('rejects requests that hit an in-progress key', async () => {
    idempotency_keys_repository.find_by_scope.mockResolvedValue({
      id: 1,
      request_hash: build_hash({ order_id: 9 }),
      status: IdempotencyKeyStatus.PROCESSING,
      response_payload: null,
      scope: 'sales.sale_orders.confirm.9',
    } as never);

    await expect(
      service.execute(
        data_source as never,
        {
          business_id: 1,
          user_id: 7,
          scope: 'sales.sale_orders.confirm.9',
          idempotency_key: 'confirm-9',
          request_payload: { order_id: 9 },
        },
        async () => ({ success: false }),
      ),
    ).rejects.toBeInstanceOf(DomainConflictException);
  });
});

function build_hash(payload: unknown): string {
  return createHash('sha256')
    .update(JSON.stringify(payload ?? {}))
    .digest('hex');
}
