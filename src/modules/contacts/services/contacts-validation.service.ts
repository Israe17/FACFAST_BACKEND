import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { BranchAccessPolicy } from '../../branches/policies/branch-access.policy';
import { Branch } from '../../branches/entities/branch.entity';
import { BranchesRepository } from '../../branches/repositories/branches.repository';
import { DomainBadRequestException } from '../../common/errors/exceptions/domain-bad-request.exception';
import { DomainConflictException } from '../../common/errors/exceptions/domain-conflict.exception';
import { DomainNotFoundException } from '../../common/errors/exceptions/domain-not-found.exception';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { InventoryLot } from '../../inventory/entities/inventory-lot.entity';
import { PriceList } from '../../inventory/entities/price-list.entity';
import { SerialEvent } from '../../inventory/entities/serial-event.entity';
import { UsersRepository } from '../../users/repositories/users.repository';
import { ContactBranchAssignmentPolicy } from '../policies/contact-branch-assignment.policy';
import { ContactBranchAssignment } from '../entities/contact-branch-assignment.entity';
import { Contact } from '../entities/contact.entity';
import { ContactBranchAssignmentsRepository } from '../repositories/contact-branch-assignments.repository';
import { ContactsRepository } from '../repositories/contacts.repository';

@Injectable()
export class ContactsValidationService {
  constructor(
    private readonly contacts_repository: ContactsRepository,
    private readonly contact_branch_assignments_repository: ContactBranchAssignmentsRepository,
    private readonly branches_repository: BranchesRepository,
    private readonly branch_access_policy: BranchAccessPolicy,
    private readonly users_repository: UsersRepository,
    private readonly contact_branch_assignment_policy: ContactBranchAssignmentPolicy,
    @InjectRepository(PriceList)
    private readonly price_list_repository: Repository<PriceList>,
    @InjectRepository(InventoryLot)
    private readonly inventory_lot_repository: Repository<InventoryLot>,
    @InjectRepository(SerialEvent)
    private readonly serial_event_repository: Repository<SerialEvent>,
    @InjectDataSource()
    private readonly data_source: DataSource,
  ) {}

  async get_contact_in_business(
    business_id: number,
    contact_id: number,
  ): Promise<Contact> {
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

  async get_contact_branch_assignment_in_business(
    business_id: number,
    assignment_id: number,
  ): Promise<ContactBranchAssignment> {
    const assignment =
      await this.contact_branch_assignments_repository.find_by_id_in_business(
        assignment_id,
        business_id,
      );
    if (!assignment) {
      throw new DomainNotFoundException({
        code: 'CONTACT_BRANCH_ASSIGNMENT_NOT_FOUND',
        messageKey: 'contacts.branch_assignment_not_found',
        details: {
          assignment_id,
        },
      });
    }

    return assignment;
  }

  async get_branch_for_assignment_access(
    current_user: AuthenticatedUserContext,
    business_id: number,
    branch_id: number,
  ): Promise<Branch> {
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

  async resolve_custom_price_list(
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

  async resolve_account_manager(
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

    this.contact_branch_assignment_policy.assert_account_manager_can_access_branch(
      user,
      branch_id,
    );
    return user;
  }

  async assert_exclusive_conflict(
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

  async count_contact_delete_dependencies(business_id: number, contact_id: number) {
    const [inventory_lots, serial_events] = await Promise.all([
      this.inventory_lot_repository.count({
        where: {
          business_id,
          supplier_contact_id: contact_id,
        },
      }),
      this.serial_event_repository.count({
        where: {
          business_id,
          contact_id,
        },
      }),
    ]);

    return {
      inventory_lots,
      serial_events,
    };
  }

  async run_serializable_transaction<T>(
    handler: (manager: EntityManager) => Promise<T>,
  ): Promise<T> {
    return this.data_source.transaction('SERIALIZABLE', handler);
  }
}
