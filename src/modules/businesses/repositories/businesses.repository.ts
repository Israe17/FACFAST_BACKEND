import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EntityCodeService } from '../../common/services/entity-code.service';
import { Business } from '../../common/entities/business.entity';

@Injectable()
export class BusinessesRepository {
  constructor(
    @InjectRepository(Business)
    private readonly business_repository: Repository<Business>,
    private readonly entity_code_service: EntityCodeService,
  ) {}

  async find_by_id(id: number): Promise<Business | null> {
    return this.business_repository.findOne({
      where: {
        id,
      },
    });
  }

  async find_all(): Promise<Business[]> {
    return this.business_repository.find({
      order: {
        name: 'ASC',
      },
    });
  }

  async save(business: Business): Promise<Business> {
    const saved_business = await this.business_repository.save(business);
    return this.entity_code_service.ensure_code(
      this.business_repository,
      saved_business,
      'BS',
    );
  }
}
