import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ContactBranchAssignment } from '../entities/contact-branch-assignment.entity';

@Injectable()
export class ContactBranchAssignmentsRepository {
  constructor(
    @InjectRepository(ContactBranchAssignment)
    private readonly assignment_repository: Repository<ContactBranchAssignment>,
  ) {}

  create(payload: Partial<ContactBranchAssignment>): ContactBranchAssignment {
    return this.assignment_repository.create(payload);
  }

  async save(
    assignment: ContactBranchAssignment,
  ): Promise<ContactBranchAssignment> {
    return this.assignment_repository.save(assignment);
  }

  async remove(assignment: ContactBranchAssignment): Promise<void> {
    await this.assignment_repository.remove(assignment);
  }

  async find_by_id_in_business(
    id: number,
    business_id: number,
  ): Promise<ContactBranchAssignment | null> {
    return this.assignment_repository.findOne({
      where: { id, business_id },
      relations: {
        branch: true,
        custom_price_list: true,
        account_manager_user: true,
      },
    });
  }

  async find_by_contact_and_branch_in_business(
    business_id: number,
    contact_id: number,
    branch_id: number,
  ): Promise<ContactBranchAssignment | null> {
    return this.assignment_repository.findOne({
      where: {
        business_id,
        contact_id,
        branch_id,
      },
      relations: {
        branch: true,
        custom_price_list: true,
        account_manager_user: true,
      },
    });
  }

  async find_all_by_contact_in_business(
    business_id: number,
    contact_id: number,
    branch_ids?: number[],
  ): Promise<ContactBranchAssignment[]> {
    if (branch_ids && branch_ids.length === 0) {
      return [];
    }

    return this.assignment_repository.find({
      where: {
        business_id,
        contact_id,
        ...(branch_ids?.length ? { branch_id: In(branch_ids) } : {}),
      },
      relations: {
        branch: true,
        custom_price_list: true,
        account_manager_user: true,
      },
      order: {
        is_active: 'DESC',
        is_exclusive: 'DESC',
        is_preferred: 'DESC',
        branch_id: 'ASC',
      },
    });
  }

  async count_by_contact_in_business(
    business_id: number,
    contact_id: number,
  ): Promise<number> {
    return this.assignment_repository.count({
      where: {
        business_id,
        contact_id,
      },
    });
  }

  async find_active_exclusive_by_contact_in_business(
    business_id: number,
    contact_id: number,
    exclude_id?: number,
  ): Promise<ContactBranchAssignment | null> {
    const query = this.assignment_repository
      .createQueryBuilder('assignment')
      .leftJoinAndSelect('assignment.branch', 'branch')
      .where('assignment.business_id = :business_id', { business_id })
      .andWhere('assignment.contact_id = :contact_id', { contact_id })
      .andWhere('assignment.is_active = true')
      .andWhere('assignment.is_exclusive = true');

    if (exclude_id !== undefined) {
      query.andWhere('assignment.id != :exclude_id', { exclude_id });
    }

    return query.getOne();
  }
}
