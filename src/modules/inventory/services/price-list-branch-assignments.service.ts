import { Injectable } from '@nestjs/common';
import { BranchAccessPolicy } from '../../branches/policies/branch-access.policy';
import { BranchesRepository } from '../../branches/repositories/branches.repository';
import { DomainBadRequestException } from '../../common/errors/exceptions/domain-bad-request.exception';
import { DomainConflictException } from '../../common/errors/exceptions/domain-conflict.exception';
import { DomainNotFoundException } from '../../common/errors/exceptions/domain-not-found.exception';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import {
  resolve_effective_branch_scope_ids,
  resolve_effective_business_id,
} from '../../common/utils/tenant-context.util';
import { CreatePriceListBranchAssignmentDto } from '../dto/create-price-list-branch-assignment.dto';
import { UpdatePriceListBranchAssignmentDto } from '../dto/update-price-list-branch-assignment.dto';
import { PriceListBranchAssignment } from '../entities/price-list-branch-assignment.entity';
import { PriceListBranchAssignmentsRepository } from '../repositories/price-list-branch-assignments.repository';
import { PriceListsRepository } from '../repositories/price-lists.repository';

@Injectable()
export class PriceListBranchAssignmentsService {
  constructor(
    private readonly price_lists_repository: PriceListsRepository,
    private readonly price_list_branch_assignments_repository: PriceListBranchAssignmentsRepository,
    private readonly branches_repository: BranchesRepository,
    private readonly branch_access_policy: BranchAccessPolicy,
  ) {}

  async get_price_list_branch_assignments(
    current_user: AuthenticatedUserContext,
    price_list_id: number,
  ) {
    const business_id = resolve_effective_business_id(current_user);
    await this.get_price_list_entity(business_id, price_list_id);
    const branch_scope_ids = resolve_effective_branch_scope_ids(current_user);
    const assignments =
      await this.price_list_branch_assignments_repository.find_all_by_price_list_in_business(
        business_id,
        price_list_id,
        branch_scope_ids,
      );

    return {
      price_list_id,
      assignments: assignments.map((assignment) =>
        this.serialize_assignment(assignment),
      ),
    };
  }

  async get_branch_price_lists(
    current_user: AuthenticatedUserContext,
    branch_id: number,
  ) {
    const business_id = resolve_effective_business_id(current_user);
    await this.get_branch_entity(current_user, business_id, branch_id);
    const assignments =
      await this.price_list_branch_assignments_repository.find_all_by_branch_in_business(
        business_id,
        branch_id,
      );

    const default_assignment =
      assignments.find((assignment) => assignment.is_default) ?? null;

    return {
      branch_id,
      default_price_list_id: default_assignment?.price_list_id ?? null,
      assignments: assignments.map((assignment) =>
        this.serialize_assignment(assignment),
      ),
    };
  }

  async create_price_list_branch_assignment(
    current_user: AuthenticatedUserContext,
    price_list_id: number,
    dto: CreatePriceListBranchAssignmentDto,
  ) {
    const business_id = resolve_effective_business_id(current_user);
    const price_list = await this.get_price_list_entity(
      business_id,
      price_list_id,
    );
    const branch = await this.get_branch_entity(
      current_user,
      business_id,
      dto.branch_id,
    );

    const existing_assignment =
      await this.price_list_branch_assignments_repository.find_by_branch_and_price_list_in_business(
        business_id,
        branch.id,
        price_list.id,
      );
    if (existing_assignment) {
      throw new DomainConflictException({
        code: 'BRANCH_PRICE_LIST_ASSIGNMENT_DUPLICATE',
        messageKey: 'inventory.branch_price_list_assignment_duplicate',
        details: {
          branch_id: branch.id,
          price_list_id: price_list.id,
        },
      });
    }

    const next_is_active = dto.is_active ?? true;
    const next_is_default = dto.is_default ?? false;
    this.assert_default_requires_active(next_is_default, next_is_active);
    this.assert_price_list_active(
      price_list,
      next_is_active || next_is_default,
    );

    // Clear other defaults BEFORE saving to minimize race window
    if (next_is_default) {
      await this.price_list_branch_assignments_repository.unset_default_for_branch(
        business_id,
        branch.id,
        0,
      );
    }

    const assignment = this.price_list_branch_assignments_repository.create({
      business_id,
      price_list_id: price_list.id,
      branch_id: branch.id,
      is_active: next_is_active,
      is_default: next_is_default,
      notes: this.normalize_optional_string(dto.notes),
    });

    const saved_assignment =
      await this.price_list_branch_assignments_repository.save(assignment);

    const hydrated_assignment =
      await this.price_list_branch_assignments_repository.find_by_id_in_business(
        saved_assignment.id,
        business_id,
      );
    if (!hydrated_assignment) {
      throw new DomainNotFoundException({
        code: 'BRANCH_PRICE_LIST_ASSIGNMENT_NOT_FOUND',
        messageKey: 'inventory.branch_price_list_assignment_not_found',
        details: {
          assignment_id: saved_assignment.id,
        },
      });
    }

    return this.serialize_assignment(hydrated_assignment);
  }

  async update_price_list_branch_assignment(
    current_user: AuthenticatedUserContext,
    price_list_id: number,
    assignment_id: number,
    dto: UpdatePriceListBranchAssignmentDto,
  ) {
    const business_id = resolve_effective_business_id(current_user);
    const assignment = await this.get_assignment_entity(
      business_id,
      price_list_id,
      assignment_id,
    );
    await this.get_branch_entity(
      current_user,
      business_id,
      assignment.branch_id,
    );

    const next_is_active = dto.is_active ?? assignment.is_active;
    const next_is_default = dto.is_default ?? assignment.is_default;
    this.assert_default_requires_active(next_is_default, next_is_active);
    this.assert_price_list_active(
      assignment.price_list,
      next_is_active || next_is_default,
    );

    if (dto.is_active !== undefined) {
      assignment.is_active = dto.is_active;
      if (!dto.is_active) {
        assignment.is_default = false;
      }
    }
    if (dto.is_default !== undefined) {
      assignment.is_default = dto.is_default;
    }
    if (dto.notes !== undefined) {
      assignment.notes = this.normalize_optional_string(dto.notes);
    }

    // Clear other defaults BEFORE saving to minimize race window
    if (next_is_default) {
      await this.price_list_branch_assignments_repository.unset_default_for_branch(
        business_id,
        assignment.branch_id,
        assignment.id,
      );
    }

    const saved_assignment =
      await this.price_list_branch_assignments_repository.save(assignment);

    const hydrated_assignment =
      await this.price_list_branch_assignments_repository.find_by_id_in_business(
        saved_assignment.id,
        business_id,
      );
    if (!hydrated_assignment) {
      throw new DomainNotFoundException({
        code: 'BRANCH_PRICE_LIST_ASSIGNMENT_NOT_FOUND',
        messageKey: 'inventory.branch_price_list_assignment_not_found',
        details: {
          assignment_id,
        },
      });
    }

    return this.serialize_assignment(hydrated_assignment);
  }

  async delete_price_list_branch_assignment(
    current_user: AuthenticatedUserContext,
    price_list_id: number,
    assignment_id: number,
  ) {
    const business_id = resolve_effective_business_id(current_user);
    const assignment = await this.get_assignment_entity(
      business_id,
      price_list_id,
      assignment_id,
    );
    await this.get_branch_entity(
      current_user,
      business_id,
      assignment.branch_id,
    );
    await this.price_list_branch_assignments_repository.remove(assignment);
    return {
      id: assignment_id,
      deleted: true,
    };
  }

  private async get_price_list_entity(
    business_id: number,
    price_list_id: number,
  ) {
    const price_list = await this.price_lists_repository.find_by_id_in_business(
      price_list_id,
      business_id,
    );
    if (!price_list) {
      throw new DomainNotFoundException({
        code: 'PRICE_LIST_NOT_FOUND',
        messageKey: 'inventory.price_list_not_found',
        details: {
          price_list_id,
        },
      });
    }

    return price_list;
  }

  private async get_branch_entity(
    current_user: AuthenticatedUserContext,
    business_id: number,
    branch_id: number,
  ) {
    const branch = await this.branches_repository.find_by_id_in_business(
      branch_id,
      business_id,
    );
    if (!branch) {
      throw new DomainNotFoundException({
        code: 'BRANCH_NOT_FOUND',
        messageKey: 'branches.not_found',
        details: {
          branch_id,
        },
      });
    }

    this.branch_access_policy.assert_can_access_branch(current_user, branch.id);
    return branch;
  }

  private async get_assignment_entity(
    business_id: number,
    price_list_id: number,
    assignment_id: number,
  ): Promise<PriceListBranchAssignment> {
    const assignment =
      await this.price_list_branch_assignments_repository.find_by_id_in_business(
        assignment_id,
        business_id,
      );
    if (!assignment || assignment.price_list_id !== price_list_id) {
      throw new DomainNotFoundException({
        code: 'BRANCH_PRICE_LIST_ASSIGNMENT_NOT_FOUND',
        messageKey: 'inventory.branch_price_list_assignment_not_found',
        details: {
          assignment_id,
          price_list_id,
        },
      });
    }

    return assignment;
  }

  private assert_default_requires_active(
    is_default: boolean,
    is_active: boolean,
  ): void {
    if (is_default && !is_active) {
      throw new DomainBadRequestException({
        code: 'BRANCH_PRICE_LIST_DEFAULT_REQUIRES_ACTIVE_ASSIGNMENT',
        messageKey:
          'inventory.branch_price_list_default_requires_active_assignment',
      });
    }
  }

  private assert_price_list_active(
    price_list: { id: number; is_active: boolean } | null | undefined,
    required: boolean,
  ): void {
    if (!required || !price_list || price_list.is_active) {
      return;
    }

    throw new DomainBadRequestException({
      code: 'PRICE_LIST_INACTIVE',
      messageKey: 'inventory.price_list_inactive',
      details: {
        price_list_id: price_list.id,
      },
    });
  }

  private serialize_assignment(assignment: PriceListBranchAssignment) {
    return {
      id: assignment.id,
      business_id: assignment.business_id,
      branch: assignment.branch
        ? {
            id: assignment.branch.id,
            code: assignment.branch.code,
            name: assignment.branch.name,
            business_name: assignment.branch.business_name,
            branch_number: assignment.branch.branch_number,
            is_active: assignment.branch.is_active,
          }
        : { id: assignment.branch_id },
      price_list: assignment.price_list
        ? {
            id: assignment.price_list.id,
            code: assignment.price_list.code,
            name: assignment.price_list.name,
            kind: assignment.price_list.kind,
            currency: assignment.price_list.currency,
            is_default: assignment.price_list.is_default,
            is_active: assignment.price_list.is_active,
          }
        : { id: assignment.price_list_id },
      is_active: assignment.is_active,
      is_default: assignment.is_default,
      notes: assignment.notes,
      lifecycle: {
        can_delete: true,
        can_deactivate: assignment.is_active,
        can_reactivate: !assignment.is_active,
        reasons: [],
      },
      created_at: assignment.created_at,
      updated_at: assignment.updated_at,
    };
  }

  private normalize_optional_string(value?: string | null): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }
}
