import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import {
  ClaimOutboxEventsOptions,
  OutboxEventsRepository,
  QueueOutboxEventInput,
} from '../repositories/outbox-events.repository';
import { OutboxEvent } from '../entities/outbox-event.entity';

@Injectable()
export class OutboxService {
  constructor(
    private readonly outbox_events_repository: OutboxEventsRepository,
  ) {}

  async queue_event(
    manager: EntityManager,
    input: QueueOutboxEventInput,
  ): Promise<OutboxEvent> {
    return this.outbox_events_repository.queue(manager, input);
  }

  async get_pending_events(limit = 100): Promise<OutboxEvent[]> {
    return this.outbox_events_repository.find_pending(limit);
  }

  async claim_next_pending_event(
    manager: EntityManager,
    options?: ClaimOutboxEventsOptions,
  ): Promise<OutboxEvent | null> {
    return this.outbox_events_repository.claim_next_pending(manager, options);
  }

  async mark_processed(
    manager: EntityManager,
    outbox_event: OutboxEvent,
  ): Promise<OutboxEvent> {
    return this.outbox_events_repository.mark_processed(manager, outbox_event);
  }

  async mark_failed(
    manager: EntityManager,
    outbox_event: OutboxEvent,
    error_message: string,
  ): Promise<OutboxEvent> {
    return this.outbox_events_repository.mark_failed(
      manager,
      outbox_event,
      error_message,
    );
  }
}
