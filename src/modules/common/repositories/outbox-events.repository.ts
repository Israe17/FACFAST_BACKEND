import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, LessThanOrEqual, Repository } from 'typeorm';
import { OutboxEvent } from '../entities/outbox-event.entity';
import { OutboxEventStatus } from '../enums/outbox-event-status.enum';

export type QueueOutboxEventInput = {
  business_id?: number | null;
  event_name: string;
  aggregate_type: string;
  aggregate_id: string | number;
  payload: Record<string, unknown>;
  available_at?: Date;
};

export type ClaimOutboxEventsOptions = {
  event_names?: string[];
};

@Injectable()
export class OutboxEventsRepository {
  constructor(
    @InjectRepository(OutboxEvent)
    private readonly outbox_event_repository: Repository<OutboxEvent>,
  ) {}

  create(payload: Partial<OutboxEvent>): OutboxEvent {
    return this.outbox_event_repository.create(payload);
  }

  async save(outbox_event: OutboxEvent): Promise<OutboxEvent> {
    return this.outbox_event_repository.save(outbox_event);
  }

  async queue(
    manager: EntityManager,
    input: QueueOutboxEventInput,
  ): Promise<OutboxEvent> {
    const repository = manager.getRepository(OutboxEvent);
    return repository.save(
      repository.create({
        business_id: input.business_id ?? null,
        event_name: input.event_name,
        aggregate_type: input.aggregate_type,
        aggregate_id: String(input.aggregate_id),
        payload: input.payload,
        status: OutboxEventStatus.PENDING,
        available_at: input.available_at ?? new Date(),
        processed_at: null,
        attempts: 0,
        last_error: null,
      }),
    );
  }

  async find_pending(limit = 100): Promise<OutboxEvent[]> {
    return this.outbox_event_repository.find({
      where: {
        status: OutboxEventStatus.PENDING,
        available_at: LessThanOrEqual(new Date()),
      },
      order: {
        id: 'ASC',
      },
      take: limit,
    });
  }

  async claim_next_pending(
    manager: EntityManager,
    options?: ClaimOutboxEventsOptions,
  ): Promise<OutboxEvent | null> {
    const repository = manager.getRepository(OutboxEvent);
    const query = repository
      .createQueryBuilder('outbox_event')
      .setLock('pessimistic_write')
      .setOnLocked('skip_locked')
      .where('outbox_event.status = :status', {
        status: OutboxEventStatus.PENDING,
      })
      .andWhere('outbox_event.available_at <= :available_at', {
        available_at: new Date(),
      })
      .orderBy('outbox_event.id', 'ASC');

    if (options?.event_names?.length) {
      query.andWhere('outbox_event.event_name IN (:...event_names)', {
        event_names: options.event_names,
      });
    }

    const event = await query.getOne();
    if (!event) {
      return null;
    }

    event.status = OutboxEventStatus.PROCESSING;
    event.attempts = Number(event.attempts ?? 0) + 1;
    event.last_error = null;
    return repository.save(event);
  }

  async mark_processed(
    manager: EntityManager,
    outbox_event: OutboxEvent,
  ): Promise<OutboxEvent> {
    const repository = manager.getRepository(OutboxEvent);
    outbox_event.status = OutboxEventStatus.PROCESSED;
    outbox_event.processed_at = new Date();
    outbox_event.last_error = null;
    return repository.save(outbox_event);
  }

  async mark_failed(
    manager: EntityManager,
    outbox_event: OutboxEvent,
    error_message: string,
  ): Promise<OutboxEvent> {
    const repository = manager.getRepository(OutboxEvent);
    outbox_event.status = OutboxEventStatus.FAILED;
    outbox_event.processed_at = new Date();
    outbox_event.last_error = error_message;
    return repository.save(outbox_event);
  }
}
