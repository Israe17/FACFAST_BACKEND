import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { BaseCodeEntity } from '../entities/base-code.entity';
import {
  build_entity_code,
  build_entity_code_pattern,
} from '../utils/entity-code.util';

@Injectable()
export class EntityCodeService {
  validate_code(prefix: string, code: string): void {
    if (!build_entity_code_pattern(prefix).test(code)) {
      throw new BadRequestException(
        `Invalid code format. Expected pattern ${prefix}-0000 or higher.`,
      );
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

    entity.code = build_entity_code(prefix, entity.id);
    try {
      return await repository.save(entity);
    } catch {
      throw new ConflictException('Could not assign entity code.');
    }
  }
}
