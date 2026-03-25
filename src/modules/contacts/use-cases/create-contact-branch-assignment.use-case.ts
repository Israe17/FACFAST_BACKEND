import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { CommandUseCase } from '../../common/application/interfaces/command-use-case.interface';
import { DomainConflictException } from '../../common/errors/exceptions/domain-conflict.exception';
import { DomainNotFoundException } from '../../common/errors/exceptions/domain-not-found.exception';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { ContactBranchAssignmentView } from '../contracts/contact-branch-assignment.view';
import { CreateContactBranchAssignmentDto } from '../dto/create-contact-branch-assignment.dto';
import { ContactBranchAssignmentPolicy } from '../policies/contact-branch-assignment.policy';
import { ContactBranchAssignmentsRepository } from '../repositories/contact-branch-assignments.repository';
import { ContactBranchAssignmentSerializer } from '../serializers/contact-branch-assignment.serializer';
import { ContactsValidationService } from '../services/contacts-validation.service';

export type CreateContactBranchAssignmentCommand = {
  current_user: AuthenticatedUserContext;
  contact_id: number;
  dto: CreateContactBranchAssignmentDto;
};

@Injectable()
export class CreateContactBranchAssignmentUseCase
  implements
    CommandUseCase<
      CreateContactBranchAssignmentCommand,
      ContactBranchAssignmentView
    >
{
  constructor(
    private readonly contacts_validation_service: ContactsValidationService,
    private readonly contact_branch_assignments_repository: ContactBranchAssignmentsRepository,
    private readonly contact_branch_assignment_policy: ContactBranchAssignmentPolicy,
    private readonly contact_branch_assignment_serializer: ContactBranchAssignmentSerializer,
  ) {}

  async execute({
    current_user,
    contact_id,
    dto,
  }: CreateContactBranchAssignmentCommand): Promise<ContactBranchAssignmentView> {
    const business_id = resolve_effective_business_id(current_user);
    await this.contacts_validation_service.get_contact_in_business(
      business_id,
      contact_id,
    );
    const branch =
      await this.contacts_validation_service.get_branch_for_assignment_access(
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

    const custom_price_list =
      await this.contacts_validation_service.resolve_custom_price_list(
        business_id,
        dto.custom_price_list_id,
      );
    const account_manager =
      await this.contacts_validation_service.resolve_account_manager(
        business_id,
        branch.id,
        dto.account_manager_user_id,
      );

    const saved_assignment =
      await this.contacts_validation_service.run_serializable_transaction(
        async (manager: EntityManager) => {
          await this.contacts_validation_service.assert_exclusive_conflict(
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
            notes: this.contact_branch_assignment_policy.normalize_optional_string(
              dto.notes,
            ),
          });

          return manager.save(assignment);
        },
      );

    const hydrated_assignment =
      await this.contacts_validation_service.get_contact_branch_assignment_in_business(
        business_id,
        saved_assignment.id,
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

    return this.contact_branch_assignment_serializer.serialize(
      hydrated_assignment,
    );
  }
}
