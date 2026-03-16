import { Injectable } from '@nestjs/common';
import { EntityManager, QueryFailedError } from 'typeorm';
import { BusinessSequence } from '../entities/business-sequence.entity';

@Injectable()
export class BusinessSequenceService {
  async next_value(
    manager: EntityManager,
    business_id: number,
    scope: string,
  ): Promise<number> {
    if (!manager.queryRunner?.isTransactionActive) {
      return manager.transaction((transaction_manager) =>
        this.next_value(transaction_manager, business_id, scope),
      );
    }

    const sequence_repository = manager.getRepository(BusinessSequence);

    let sequence = await sequence_repository
      .createQueryBuilder('business_sequence')
      .setLock('pessimistic_write')
      .where('business_sequence.business_id = :business_id', { business_id })
      .andWhere('business_sequence.scope = :scope', { scope })
      .getOne();

    if (!sequence) {
      try {
        sequence = sequence_repository.create({
          business_id,
          scope,
          next_value: 2,
        });
        await sequence_repository.save(sequence);
        return 1;
      } catch (error) {
        if (!this.is_unique_violation(error)) {
          throw error;
        }

        return this.next_value(manager, business_id, scope);
      }
    }

    const current_value = sequence.next_value;
    sequence.next_value = current_value + 1;
    await sequence_repository.save(sequence);
    return current_value;
  }

  format_code(prefix: string, value: number): string {
    const value_segment = value.toString().padStart(4, '0');
    return `${prefix}-${value_segment}`;
  }

  private is_unique_violation(error: unknown): boolean {
    if (!(error instanceof QueryFailedError)) {
      return false;
    }

    const driver_error = error.driverError as { code?: string } | undefined;
    return driver_error?.code === '23505';
  }
}
