import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, QueryFailedError } from 'typeorm';
import { DomainConflictException } from '../errors/exceptions/domain-conflict.exception';
import { IdempotencyKey } from '../entities/idempotency-key.entity';
import { IdempotencyKeyStatus } from '../enums/idempotency-key-status.enum';
import {
  IdempotencyKeysRepository,
  IdempotencyScopeInput,
} from '../repositories/idempotency-keys.repository';
import { createHash } from 'crypto';

export type ExecuteIdempotentCommandOptions = {
  business_id?: number | null;
  user_id?: number | null;
  scope: string;
  idempotency_key?: string | null;
  request_payload: unknown;
};

@Injectable()
export class IdempotencyService {
  constructor(
    private readonly idempotency_keys_repository: IdempotencyKeysRepository,
  ) {}

  async execute<T>(
    data_source: DataSource,
    options: ExecuteIdempotentCommandOptions,
    work: (manager: EntityManager) => Promise<T>,
  ): Promise<T> {
    const normalized_key = this.normalize_key(options.idempotency_key);
    if (!normalized_key) {
      return data_source.transaction((manager) => work(manager));
    }

    const request_hash = this.build_request_hash(options.request_payload);
    const scope = this.build_scope_input(options, normalized_key);
    const existing = await this.idempotency_keys_repository.find_by_scope(scope);
    if (existing) {
      return this.resolve_existing_result<T>(existing, request_hash);
    }

    try {
      return await data_source.transaction(async (manager) => {
        const processing_key =
          await this.idempotency_keys_repository.create_processing(manager, {
            ...scope,
            request_hash,
          });
        const response = await work(manager);
        await this.idempotency_keys_repository.mark_completed(
          manager,
          processing_key,
          (response ?? {}) as Record<string, unknown>,
        );
        return response;
      });
    } catch (error) {
      if (this.is_unique_violation(error)) {
        const conflicted =
          await this.idempotency_keys_repository.find_by_scope(scope);
        if (conflicted) {
          return this.resolve_existing_result<T>(conflicted, request_hash);
        }
      }

      throw error;
    }
  }

  private resolve_existing_result<T>(
    existing: IdempotencyKey,
    request_hash: string,
  ): T {
    this.assert_same_request(existing, request_hash);

    if (existing.status !== IdempotencyKeyStatus.COMPLETED) {
      throw new DomainConflictException({
        code: 'IDEMPOTENCY_KEY_IN_PROGRESS',
        messageKey: 'common.idempotency_key_in_progress',
        details: {
          scope: existing.scope,
        },
      });
    }

    return (existing.response_payload ?? {}) as T;
  }

  private assert_same_request(
    existing: IdempotencyKey,
    request_hash: string,
  ): void {
    if (existing.request_hash !== request_hash) {
      throw new DomainConflictException({
        code: 'IDEMPOTENCY_KEY_PAYLOAD_MISMATCH',
        messageKey: 'common.idempotency_key_payload_mismatch',
        details: {
          scope: existing.scope,
        },
      });
    }
  }

  private build_request_hash(payload: unknown): string {
    return createHash('sha256')
      .update(JSON.stringify(payload ?? {}))
      .digest('hex');
  }

  private build_scope_input(
    options: ExecuteIdempotentCommandOptions,
    normalized_key: string,
  ): IdempotencyScopeInput {
    return {
      business_id: options.business_id ?? null,
      user_id: options.user_id ?? null,
      scope: options.scope,
      idempotency_key: normalized_key,
    };
  }

  private normalize_key(idempotency_key?: string | null): string | null {
    const normalized = idempotency_key?.trim();
    return normalized ? normalized : null;
  }

  private is_unique_violation(error: unknown): boolean {
    return (
      error instanceof QueryFailedError &&
      typeof (error as QueryFailedError & { code?: string }).code === 'string' &&
      (error as QueryFailedError & { code?: string }).code === '23505'
    );
  }
}
