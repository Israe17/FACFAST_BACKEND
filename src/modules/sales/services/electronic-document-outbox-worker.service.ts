import {
  Injectable,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { StructuredLoggerService } from '../../common/logging/structured-logger.service';
import { OutboxService } from '../../common/services/outbox.service';
import { ProcessElectronicDocumentEmissionOutboxUseCase } from '../use-cases/process-electronic-document-emission-outbox.use-case';

const ELECTRONIC_DOCUMENT_EMIT_REQUESTED_EVENT =
  'sales.electronic_document.emit_requested';

@Injectable()
export class ElectronicDocumentOutboxWorkerService
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private timer: NodeJS.Timeout | null = null;
  private is_processing = false;

  constructor(
    private readonly config_service: ConfigService,
    private readonly data_source: DataSource,
    private readonly outbox_service: OutboxService,
    private readonly process_electronic_document_emission_outbox_use_case: ProcessElectronicDocumentEmissionOutboxUseCase,
    private readonly structured_logger_service: StructuredLoggerService,
  ) {}

  onApplicationBootstrap(): void {
    const workers_enabled = this.config_service.get<boolean>(
      'app.outbox_workers_enabled',
      true,
    );
    if (!workers_enabled) {
      return;
    }

    const poll_interval_ms = this.config_service.get<number>(
      'app.outbox_poll_interval_ms',
      5000,
    );

    this.timer = setInterval(() => {
      void this.process_batch();
    }, poll_interval_ms);

    void this.process_batch();
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private async process_batch(): Promise<void> {
    if (this.is_processing) {
      return;
    }

    this.is_processing = true;
    try {
      const batch_size = this.config_service.get<number>(
        'app.outbox_batch_size',
        10,
      );

      for (let index = 0; index < batch_size; index += 1) {
        const processed = await this.process_single_event();
        if (!processed) {
          break;
        }
      }
    } finally {
      this.is_processing = false;
    }
  }

  private async process_single_event(): Promise<boolean> {
    return this.data_source.transaction(async (manager) => {
      const outbox_event = await this.outbox_service.claim_next_pending_event(
        manager,
        {
          event_names: [ELECTRONIC_DOCUMENT_EMIT_REQUESTED_EVENT],
        },
      );
      if (!outbox_event) {
        return false;
      }

      try {
        await this.process_electronic_document_emission_outbox_use_case.execute({
          manager,
          outbox_event,
        });
        await this.outbox_service.mark_processed(manager, outbox_event);
        this.structured_logger_service.log('log', 'outbox.event_processed', {
          outbox_event_id: outbox_event.id,
          event_name: outbox_event.event_name,
          aggregate_type: outbox_event.aggregate_type,
          aggregate_id: outbox_event.aggregate_id,
        });
      } catch (error) {
        const error_message =
          error instanceof Error ? error.message : 'Unknown outbox error';
        await this.outbox_service.mark_failed(
          manager,
          outbox_event,
          error_message,
        );
        this.structured_logger_service.log(
          'error',
          'outbox.event_failed',
          {
            outbox_event_id: outbox_event.id,
            event_name: outbox_event.event_name,
            aggregate_type: outbox_event.aggregate_type,
            aggregate_id: outbox_event.aggregate_id,
            error_message,
          },
          error instanceof Error ? error.stack : undefined,
        );
      }

      return true;
    });
  }
}
