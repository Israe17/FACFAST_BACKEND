import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EntityCodeService } from '../../common/services/entity-code.service';
import { ElectronicDocument } from '../entities/electronic-document.entity';

@Injectable()
export class ElectronicDocumentsRepository {
  constructor(
    @InjectRepository(ElectronicDocument)
    private readonly electronic_document_repository: Repository<ElectronicDocument>,
    private readonly entity_code_service: EntityCodeService,
  ) {}

  create(payload: Partial<ElectronicDocument>): ElectronicDocument {
    return this.electronic_document_repository.create(payload);
  }

  async save(document: ElectronicDocument): Promise<ElectronicDocument> {
    const saved_document =
      await this.electronic_document_repository.save(document);
    return this.entity_code_service.ensure_code(
      this.electronic_document_repository,
      saved_document,
      'FE',
    );
  }

  async find_all_by_business(
    business_id: number,
  ): Promise<ElectronicDocument[]> {
    return this.electronic_document_repository.find({
      where: { business_id },
      relations: ['sale_order', 'branch'],
      order: { created_at: 'DESC' },
    });
  }

  async find_by_id_in_business(
    id: number,
    business_id: number,
  ): Promise<ElectronicDocument | null> {
    return this.electronic_document_repository.findOne({
      where: { id, business_id },
      relations: ['sale_order', 'branch'],
    });
  }

  async find_by_sale_order_id(
    sale_order_id: number,
    business_id: number,
  ): Promise<ElectronicDocument[]> {
    return this.electronic_document_repository.find({
      where: { sale_order_id, business_id },
      relations: ['sale_order', 'branch'],
      order: { created_at: 'DESC' },
    });
  }
}
