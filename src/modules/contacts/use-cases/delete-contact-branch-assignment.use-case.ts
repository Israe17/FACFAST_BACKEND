import { Injectable } from '@nestjs/common';
import { CommandUseCase } from '../../common/application/interfaces/command-use-case.interface';
import { DomainNotFoundException } from '../../common/errors/exceptions/domain-not-found.exception';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { ContactBranchAssignmentsRepository } from '../repositories/contact-branch-assignments.repository';
import { ContactsValidationService } from '../services/contacts-validation.service';

export type DeleteContactBranchAssignmentCommand = {
  current_user: AuthenticatedUserContext;
  contact_id?: number;
  assignment_id: number;
};

export type DeleteContactBranchAssignmentResult = {
  id: number;
  deleted: true;
};

@Injectable()
export class DeleteContactBranchAssignmentUseCase
  implements
    CommandUseCase<
      DeleteContactBranchAssignmentCommand,
      DeleteContactBranchAssignmentResult
    >
{
  constructor(
    private readonly contacts_validation_service: ContactsValidationService,
    private readonly contact_branch_assignments_repository: ContactBranchAssignmentsRepository,
  ) {}

  async execute({
    current_user,
    contact_id,
    assignment_id,
  }: DeleteContactBranchAssignmentCommand): Promise<DeleteContactBranchAssignmentResult> {
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
    await this.contact_branch_assignments_repository.remove(assignment);

    return {
      id: assignment_id,
      deleted: true,
    };
  }
}
