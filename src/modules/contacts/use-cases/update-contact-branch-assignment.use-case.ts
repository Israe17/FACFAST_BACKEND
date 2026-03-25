import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { CommandUseCase } from '../../common/application/interfaces/command-use-case.interface';
import { DomainNotFoundException } from '../../common/errors/exceptions/domain-not-found.exception';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { ContactBranchAssignmentView } from '../contracts/contact-branch-assignment.view';
import { UpdateContactBranchAssignmentDto } from '../dto/update-contact-branch-assignment.dto';
import { ContactBranchAssignmentPolicy } from '../policies/contact-branch-assignment.policy';
import { ContactBranchAssignmentsRepository } from '../repositories/contact-branch-assignments.repository';
import { ContactBranchAssignmentSerializer } from '../serializers/contact-branch-assignment.serializer';
import { ContactsValidationService } from '../services/contacts-validation.service';

export type UpdateContactBranchAssignmentCommand = {
  current_user: AuthenticatedUserContext;
  contact_id?: number;
  assignment_id: number;
  dto: UpdateContactBranchAssignmentDto;
};

@Injectable()
export class UpdateContactBranchAssignmentUseCase
  implements
    CommandUseCase<
      UpdateContactBranchAssignmentCommand,
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
    assignment_id,
    dto,
  }: UpdateContactBranchAssignmentCommand): Promise<ContactBranchAssignmentView> {
    const business_id = resolve_effective_business_id(current_user);
    if (contact_id !== undefined) {
      await this.contacts_validation_service.get_contact_in_business(
        business_id,
        contact_id,
      );
    }
    const assignment =
      await this.contacts_validation_service.get_contact_branch_assignment_in_business(
        business_id,
        assignment_id,
      );

    if (contact_id !== undefined && assignment.contact_id !== contact_id) {
      throw new DomainNotFoundException({
        code: 'CONTACT_BRANCH_ASSIGNMENT_NOT_FOUND',
        messageKey: 'contacts.branch_assignment_not_found',
        details: {
          assignment_id,
          contact_id,
        },
      });
    }

    await this.contacts_validation_service.get_branch_for_assignment_access(
      current_user,
      business_id,
      assignment.branch_id,
    );

    const next_is_active = dto.is_active ?? assignment.is_active;
    const next_is_exclusive = dto.is_exclusive ?? assignment.is_exclusive;

    const saved_assignment =
      await this.contacts_validation_service.run_serializable_transaction(
        async (_manager: EntityManager) => {
          await this.contacts_validation_service.assert_exclusive_conflict(
            business_id,
            assignment.contact_id,
            next_is_active,
            next_is_exclusive,
            assignment.id,
          );

          if (dto.custom_price_list_id !== undefined) {
            const custom_price_list =
              await this.contacts_validation_service.resolve_custom_price_list(
                business_id,
                dto.custom_price_list_id,
              );
            assignment.custom_price_list_id = custom_price_list?.id ?? null;
          }

          if (dto.account_manager_user_id !== undefined) {
            const account_manager =
              await this.contacts_validation_service.resolve_account_manager(
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
            assignment.notes =
              this.contact_branch_assignment_policy.normalize_optional_string(
                dto.notes,
              );
          }

          return this.contact_branch_assignments_repository.save(assignment);
        },
      );

    const hydrated_assignment =
      await this.contacts_validation_service.get_contact_branch_assignment_in_business(
        business_id,
        saved_assignment.id,
      );
    return this.contact_branch_assignment_serializer.serialize(
      hydrated_assignment,
    );
  }
}
