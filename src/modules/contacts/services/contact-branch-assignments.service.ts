import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
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
import { PriceList } from '../../inventory/entities/price-list.entity';
import { UsersRepository } from '../../users/repositories/users.repository';
import { CreateContactBranchAssignmentDto } from '../dto/create-contact-branch-assignment.dto';
import { UpdateContactBranchAssignmentDto } from '../dto/update-contact-branch-assignment.dto';
import { ContactBranchAssignment } from '../entities/contact-branch-assignment.entity';
import { ContactBranchAssignmentsRepository } from '../repositories/contact-branch-assignments.repository';
import { ContactsRepository } from '../repositories/contacts.repository';

@Injectable()
export class ContactBranchAssignmentsService {
  constructor(
    private readonly contacts_repository: ContactsRepository,
    private readonly contact_branch_assignments_repository: ContactBranchAssignmentsRepository,
    private readonly branches_repository: BranchesRepository,
    private readonly branch_access_policy: BranchAccessPolicy,
    private readonly users_repository: UsersRepository,
    @InjectRepository(PriceList)
    private readonly price_list_repository: Repository<PriceList>,
    @InjectDataSource()
    private readonly data_source: DataSource,
  ) {}

  async get_contact_branch_assignments(
    current_user: AuthenticatedUserContext,
    contact_id: number,
  ) {
    const business_id = resolve_effective_business_id(current_user);
    await this.get_contact_entity(business_id, contact_id);

    const branch_scope_ids = resolve_effective_branch_scope_ids(current_user);
    const [assignments, total_assignments] = await Promise.all([
      this.contact_branch_assignments_repository.find_all_by_contact_in_business(
        business_id,
        contact_id,
        branch_scope_ids,
      ),
      this.contact_branch_assignments_repository.count_by_contact_in_business(
        business_id,
        contact_id,
      ),
    ]);

    return {
      contact_id,
      mode: total_assignments === 0 ? 'global' : 'scoped',
      global_applies_to_all_branches: total_assignments === 0,
      assignments: assignments.map((assignment) =>
        this.serialize_assignment(assignment),
      ),
    };
  }

  async create_contact_branch_assignment(
    current_user: AuthenticatedUserContext,
    contact_id: number,
    dto: CreateContactBranchAssignmentDto,
  ) {
    const business_id = resolve_effective_business_id(current_user);
    await this.get_contact_entity(business_id, contact_id);
    const branch = await this.get_branch_entity(
      current_user,
      business_id,
      dto.branch_id,
    );

    const existing_assignment =
      await this.contact_branch_assignments_repository.find_by_contact_and_branch_in_business(
        business_id,
        contact_id,
        branch.id,
      );
    if (existing_assignment) {
      throw new DomainConflictException({
        code: 'CONTACT_BRANCH_ASSIGNMENT_DUPLICATE',
        messageKey: 'contacts.branch_assignment_duplicate',
        details: {
          contact_id,
          branch_id: branch.id,
        },
      });
    }

    const custom_price_list = await this.resolve_custom_price_list(
      business_id,
      dto.custom_price_list_id,
    );
    const account_manager = await this.resolve_account_manager(
      business_id,
      branch.id,
      dto.account_manager_user_id,
    );

    const saved_assignment = await this.data_source.transaction(
      'SERIALIZABLE',
      async (manager) => {
        await this.assert_exclusive_conflict(
          business_id,
          contact_id,
          dto.is_active ?? true,
          dto.is_exclusive ?? false,
        );

        const assignment = this.contact_branch_assignments_repository.create({
          business_id,
          contact_id,
          branch_id: branch.id,
          is_active: dto.is_active ?? true,
          is_default: dto.is_default ?? false,
          is_preferred: dto.is_preferred ?? false,
          is_exclusive: dto.is_exclusive ?? false,
          sales_enabled: dto.sales_enabled ?? true,
          purchases_enabled: dto.purchases_enabled ?? true,
          credit_enabled: dto.credit_enabled ?? false,
          custom_credit_limit: dto.custom_credit_limit ?? null,
          custom_price_list_id: custom_price_list?.id ?? null,
          account_manager_user_id: account_manager?.id ?? null,
          notes: this.normalize_optional_string(dto.notes),
        });

        return manager.save(assignment);
      },
    );
    const hydrated_assignment =
      await this.contact_branch_assignments_repository.find_by_id_in_business(
        saved_assignment.id,
        business_id,
      );
    if (!hydrated_assignment) {
      throw new DomainNotFoundException({
        code: 'CONTACT_BRANCH_ASSIGNMENT_NOT_FOUND',
        messageKey: 'contacts.branch_assignment_not_found',
        details: {
          assignment_id: saved_assignment.id,
        },
      });
    }

    return this.serialize_assignment(hydrated_assignment);
  }

  async update_contact_branch_assignment(
    current_user: AuthenticatedUserContext,
    contact_id: number,
    assignment_id: number,
    dto: UpdateContactBranchAssignmentDto,
  ) {
    const business_id = resolve_effective_business_id(current_user);
    await this.get_contact_entity(business_id, contact_id);
    const assignment = await this.get_assignment_entity(
      business_id,
      contact_id,
      assignment_id,
    );

    await this.get_branch_entity(
      current_user,
      business_id,
      assignment.branch_id,
    );

    const next_is_active = dto.is_active ?? assignment.is_active;
    const next_is_exclusive = dto.is_exclusive ?? assignment.is_exclusive;

    const saved_assignment = await this.data_source.transaction(
      'SERIALIZABLE',
      async (manager) => {
        await this.assert_exclusive_conflict(
          business_id,
          contact_id,
          next_is_active,
          next_is_exclusive,
          assignment.id,
        );

        if (dto.custom_price_list_id !== undefined) {
          const custom_price_list = await this.resolve_custom_price_list(
            business_id,
            dto.custom_price_list_id,
          );
          assignment.custom_price_list_id = custom_price_list?.id ?? null;
        }

        if (dto.account_manager_user_id !== undefined) {
          const account_manager = await this.resolve_account_manager(
            business_id,
            assignment.branch_id,
            dto.account_manager_user_id,
          );
          assignment.account_manager_user_id = account_manager?.id ?? null;
        }

        if (dto.is_active !== undefined) {
          assignment.is_active = dto.is_active;
        }
        if (dto.is_default !== undefined) {
          assignment.is_default = dto.is_default;
        }
        if (dto.is_preferred !== undefined) {
          assignment.is_preferred = dto.is_preferred;
        }
        if (dto.is_exclusive !== undefined) {
          assignment.is_exclusive = dto.is_exclusive;
        }
        if (dto.sales_enabled !== undefined) {
          assignment.sales_enabled = dto.sales_enabled;
        }
        if (dto.purchases_enabled !== undefined) {
          assignment.purchases_enabled = dto.purchases_enabled;
        }
        if (dto.credit_enabled !== undefined) {
          assignment.credit_enabled = dto.credit_enabled;
        }
        if (dto.custom_credit_limit !== undefined) {
          assignment.custom_credit_limit = dto.custom_credit_limit;
        }
        if (dto.notes !== undefined) {
          assignment.notes = this.normalize_optional_string(dto.notes);
        }

        return manager.save(assignment);
      },
    );
    const hydrated_assignment =
      await this.contact_branch_assignments_repository.find_by_id_in_business(
        saved_assignment.id,
        business_id,
      );
    if (!hydrated_assignment) {
      throw new DomainNotFoundException({
        code: 'CONTACT_BRANCH_ASSIGNMENT_NOT_FOUND',
        messageKey: 'contacts.branch_assignment_not_found',
        details: {
          assignment_id,
        },
      });
    }

    return this.serialize_assignment(hydrated_assignment);
  }

  async delete_contact_branch_assignment(
    current_user: AuthenticatedUserContext,
    contact_id: number,
    assignment_id: number,
  ) {
    const business_id = resolve_effective_business_id(current_user);
    await this.get_contact_entity(business_id, contact_id);
    const assignment = await this.get_assignment_entity(
      business_id,
      contact_id,
      assignment_id,
    );
    await this.get_branch_entity(
      current_user,
      business_id,
      assignment.branch_id,
    );
    await this.contact_branch_assignments_repository.remove(assignment);
    return {
      id: assignment_id,
      deleted: true,
    };
  }

  private async get_contact_entity(business_id: number, contact_id: number) {
    const contact = await this.contacts_repository.find_by_id_in_business(
      contact_id,
      business_id,
    );
    if (!contact) {
      throw new DomainNotFoundException({
        code: 'CONTACT_NOT_FOUND',
        messageKey: 'contacts.not_found',
        details: {
          contact_id,
        },
      });
    }

    return contact;
  }

  private async get_assignment_entity(
    business_id: number,
    contact_id: number,
    assignment_id: number,
  ): Promise<ContactBranchAssignment> {
    const assignment =
      await this.contact_branch_assignments_repository.find_by_id_in_business(
        assignment_id,
        business_id,
      );
    if (!assignment || assignment.contact_id !== contact_id) {
      throw new DomainNotFoundException({
        code: 'CONTACT_BRANCH_ASSIGNMENT_NOT_FOUND',
        messageKey: 'contacts.branch_assignment_not_found',
        details: {
          assignment_id,
          contact_id,
        },
      });
    }

    return assignment;
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

  private async resolve_custom_price_list(
    business_id: number,
    price_list_id?: number | null,
  ): Promise<PriceList | null> {
    if (price_list_id === undefined || price_list_id === null) {
      return null;
    }

    const price_list = await this.price_list_repository.findOne({
      where: {
        id: price_list_id,
        business_id,
      },
    });
    if (!price_list) {
      throw new DomainNotFoundException({
        code: 'PRICE_LIST_NOT_FOUND',
        messageKey: 'inventory.price_list_not_found',
        details: {
          price_list_id,
        },
      });
    }
    if (!price_list.is_active) {
      throw new DomainBadRequestException({
        code: 'PRICE_LIST_INACTIVE',
        messageKey: 'inventory.price_list_inactive',
        details: {
          price_list_id,
        },
      });
    }

    return price_list;
  }

  private async resolve_account_manager(
    business_id: number,
    branch_id: number,
    user_id?: number | null,
  ) {
    if (user_id === undefined || user_id === null) {
      return null;
    }

    const user = await this.users_repository.find_by_id_in_business(
      user_id,
      business_id,
    );
    if (!user) {
      throw new DomainNotFoundException({
        code: 'USER_NOT_FOUND',
        messageKey: 'users.not_found',
        details: {
          user_id,
        },
      });
    }

    if (!this.user_has_branch_access(user, branch_id)) {
      throw new DomainBadRequestException({
        code: 'CONTACT_ACCOUNT_MANAGER_BRANCH_SCOPE_INVALID',
        messageKey: 'contacts.account_manager_branch_scope_invalid',
        details: {
          account_manager_user_id: user_id,
          branch_id,
        },
      });
    }

    return user;
  }

  private user_has_branch_access(
    user: {
      user_type: string;
      is_platform_admin?: boolean;
      user_branch_access?: Array<{ branch_id: number }>;
    },
    branch_id: number,
  ): boolean {
    if (user.is_platform_admin === true || user.user_type === 'owner') {
      return true;
    }

    const branch_ids =
      user.user_branch_access?.map((assignment) => assignment.branch_id) ?? [];
    if (!branch_ids.length) {
      return true;
    }

    return branch_ids.includes(branch_id);
  }

  private async assert_exclusive_conflict(
    business_id: number,
    contact_id: number,
    is_active: boolean,
    is_exclusive: boolean,
    exclude_assignment_id?: number,
  ): Promise<void> {
    if (!is_active || !is_exclusive) {
      return;
    }

    const existing_exclusive =
      await this.contact_branch_assignments_repository.find_active_exclusive_by_contact_in_business(
        business_id,
        contact_id,
        exclude_assignment_id,
      );
    if (!existing_exclusive) {
      return;
    }

    throw new DomainConflictException({
      code: 'CONTACT_BRANCH_EXCLUSIVE_CONFLICT',
      messageKey: 'contacts.branch_exclusive_conflict',
      details: {
        contact_id,
        branch_id: existing_exclusive.branch_id,
      },
    });
  }

  private serialize_assignment(assignment: ContactBranchAssignment) {
    return {
      id: assignment.id,
      business_id: assignment.business_id,
      contact_id: assignment.contact_id,
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
      is_active: assignment.is_active,
      is_default: assignment.is_default,
      is_preferred: assignment.is_preferred,
      is_exclusive: assignment.is_exclusive,
      sales_enabled: assignment.sales_enabled,
      purchases_enabled: assignment.purchases_enabled,
      credit_enabled: assignment.credit_enabled,
      custom_credit_limit: assignment.custom_credit_limit,
      custom_price_list: assignment.custom_price_list
        ? {
            id: assignment.custom_price_list.id,
            code: assignment.custom_price_list.code,
            name: assignment.custom_price_list.name,
            kind: assignment.custom_price_list.kind,
            currency: assignment.custom_price_list.currency,
            is_active: assignment.custom_price_list.is_active,
          }
        : null,
      account_manager: assignment.account_manager_user
        ? {
            id: assignment.account_manager_user.id,
            code: assignment.account_manager_user.code,
            name: assignment.account_manager_user.name,
            email: assignment.account_manager_user.email,
            status: assignment.account_manager_user.status,
          }
        : null,
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
