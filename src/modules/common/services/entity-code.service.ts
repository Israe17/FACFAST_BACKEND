import { Injectable } from '@nestjs/common';
import { QueryFailedError, Repository } from 'typeorm';
import { DomainBadRequestException } from '../errors/exceptions/domain-bad-request.exception';
import { DomainConflictException } from '../errors/exceptions/domain-conflict.exception';
import { BaseCodeEntity } from '../entities/base-code.entity';
import { BusinessSequenceService } from './business-sequence.service';
import {
  build_entity_code,
  build_entity_code_pattern,
} from '../utils/entity-code.util';

@Injectable()
export class EntityCodeService {
  constructor(
    private readonly business_sequence_service: BusinessSequenceService,
  ) {}

  validate_code(prefix: string, code: string): void {
    if (!build_entity_code_pattern(prefix).test(code)) {
      throw new DomainBadRequestException({
        code: 'ENTITY_CODE_INVALID_FORMAT',
        messageKey: 'common.entity_code_invalid_format',
        details: {
          field: 'code',
          prefix,
        },
        params: {
          prefix,
        },
      });
    }
  }

  async ensure_code<T extends BaseCodeEntity>(
    repository: Repository<T>,
    entity: T,
    prefix: string,
  ): Promise<T> {
    if (entity.code) {
      this.validate_code(prefix, entity.code);
      return entity;
    }

    const business_id = this.resolve_business_id(entity);
    entity.code =
      business_id === null
        ? build_entity_code(prefix, entity.id)
        : build_entity_code(
            prefix,
            await this.business_sequence_service.next_value(
              repository.manager,
              business_id,
              this.build_sequence_scope(repository, prefix),
            ),
          );

    try {
      return await repository.save(entity);
    } catch (error) {
      if (!this.is_unique_violation(error)) {
        throw error;
      }

      throw new DomainConflictException({
        code: 'ENTITY_CODE_ASSIGNMENT_CONFLICT',
        messageKey: 'common.entity_code_assignment_conflict',
        details: {
          field: 'code',
          prefix,
        },
        params: {
          prefix,
        },
      });
    }
  }

  private is_unique_violation(error: unknown): boolean {
    if (!(error instanceof QueryFailedError)) {
      return false;
    }

    const driver_error = error.driverError as { code?: string } | undefined;
    return driver_error?.code === '23505';
  }

  private resolve_business_id(entity: BaseCodeEntity): number | null {
    const candidate = (entity as BaseCodeEntity & { business_id?: unknown })
      .business_id;

    return typeof candidate === 'number' ? candidate : null;
  }

  private build_sequence_scope<T extends BaseCodeEntity>(
    repository: Repository<T>,
    prefix: string,
  ): string {
    const table_name = repository.metadata?.tableName;
    return table_name ? `${table_name}:code:${prefix}` : `code:${prefix}`;
  }
}
