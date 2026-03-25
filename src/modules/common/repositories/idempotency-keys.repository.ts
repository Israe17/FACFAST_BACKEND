import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { IdempotencyKey } from '../entities/idempotency-key.entity';
import { IdempotencyKeyStatus } from '../enums/idempotency-key-status.enum';

export type IdempotencyScopeInput = {
  business_id?: number | null;
  user_id?: number | null;
  scope: string;
  idempotency_key: string;
};

export type CreateIdempotencyKeyInput = IdempotencyScopeInput & {
  request_hash: string;
};

@Injectable()
export class IdempotencyKeysRepository {
  constructor(
    @InjectRepository(IdempotencyKey)
    private readonly idempotency_key_repository: Repository<IdempotencyKey>,
  ) {}

  async find_by_scope(
    input: IdempotencyScopeInput,
  ): Promise<IdempotencyKey | null> {
    const qb = this.idempotency_key_repository
      .createQueryBuilder('idempotency_key')
      .where('idempotency_key.scope = :scope', {
        scope: input.scope,
      })
      .andWhere('idempotency_key.idempotency_key = :idempotency_key', {
        idempotency_key: input.idempotency_key,
      });

    if (input.business_id === null || input.business_id === undefined) {
      qb.andWhere('idempotency_key.business_id IS NULL');
    } else {
      qb.andWhere('idempotency_key.business_id = :business_id', {
        business_id: input.business_id,
      });
    }

    if (input.user_id === null || input.user_id === undefined) {
      qb.andWhere('idempotency_key.user_id IS NULL');
    } else {
      qb.andWhere('idempotency_key.user_id = :user_id', {
        user_id: input.user_id,
      });
    }

    return qb.getOne();
  }

  async create_processing(
    manager: EntityManager,
    input: CreateIdempotencyKeyInput,
  ): Promise<IdempotencyKey> {
    const repository = manager.getRepository(IdempotencyKey);
    return repository.save(
      repository.create({
        business_id: input.business_id ?? null,
        user_id: input.user_id ?? null,
        scope: input.scope,
        idempotency_key: input.idempotency_key,
        request_hash: input.request_hash,
        status: IdempotencyKeyStatus.PROCESSING,
        response_payload: null,
      }),
    );
  }

  async mark_completed(
    manager: EntityManager,
    idempotency_key: IdempotencyKey,
    response_payload: Record<string, unknown>,
  ): Promise<IdempotencyKey> {
    const repository = manager.getRepository(IdempotencyKey);
    idempotency_key.status = IdempotencyKeyStatus.COMPLETED;
    idempotency_key.response_payload = response_payload;
    return repository.save(idempotency_key);
  }
}
