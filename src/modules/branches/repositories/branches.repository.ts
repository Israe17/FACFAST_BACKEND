import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { EntityCodeService } from '../../common/services/entity-code.service';
import { Branch } from '../entities/branch.entity';

@Injectable()
export class BranchesRepository {
  constructor(
    @InjectRepository(Branch)
    private readonly branch_repository: Repository<Branch>,
    private readonly entity_code_service: EntityCodeService,
  ) {}

  create(payload: Partial<Branch>): Branch {
    return this.branch_repository.create(payload);
  }

  async save(branch: Branch): Promise<Branch> {
    const saved_branch = await this.branch_repository.save(branch);
    return this.entity_code_service.ensure_code(
      this.branch_repository,
      saved_branch,
      'BR',
    );
  }

  async remove(branch: Branch): Promise<void> {
    await this.branch_repository.remove(branch);
  }

  async find_all_by_business(
    business_id: number,
    branch_ids?: number[],
  ): Promise<Branch[]> {
    if (branch_ids && branch_ids.length === 0) {
      return [];
    }

    return this.branch_repository.find({
      where: {
        business_id,
        ...(branch_ids?.length ? { id: In(branch_ids) } : {}),
      },
      relations: {
        terminals: true,
      },
      order: {
        branch_number: 'ASC',
      },
    });
  }

  async find_by_id_in_business(
    id: number,
    business_id: number,
  ): Promise<Branch | null> {
    return this.branch_repository.findOne({
      where: {
        id,
        business_id,
      },
      relations: {
        terminals: true,
      },
    });
  }

  async find_many_by_ids_in_business(
    ids: number[],
    business_id: number,
  ): Promise<Branch[]> {
    if (!ids.length) {
      return [];
    }

    return this.branch_repository.find({
      where: {
        business_id,
        id: In(ids),
      },
      order: {
        branch_number: 'ASC',
      },
    });
  }
}
