import { Injectable } from '@nestjs/common';
import { QueryUseCase } from '../../common/application/interfaces/query-use-case.interface';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import {
  resolve_effective_branch_scope_ids,
  resolve_effective_business_id,
} from '../../common/utils/tenant-context.util';
import { ContactBranchAssignmentsView } from '../contracts/contact-branch-assignments.view';
import { ContactBranchAssignmentsRepository } from '../repositories/contact-branch-assignments.repository';
import { ContactBranchAssignmentSerializer } from '../serializers/contact-branch-assignment.serializer';
import { ContactsValidationService } from '../services/contacts-validation.service';

export type GetContactBranchAssignmentsQuery = {
  current_user: AuthenticatedUserContext;
  contact_id: number;
};

@Injectable()
export class GetContactBranchAssignmentsQueryUseCase
  implements
    QueryUseCase<GetContactBranchAssignmentsQuery, ContactBranchAssignmentsView>
{
  constructor(
    private readonly contacts_validation_service: ContactsValidationService,
    private readonly contact_branch_assignments_repository: ContactBranchAssignmentsRepository,
    private readonly contact_branch_assignment_serializer: ContactBranchAssignmentSerializer,
  ) {}

  async execute({
    current_user,
    contact_id,
  }: GetContactBranchAssignmentsQuery): Promise<ContactBranchAssignmentsView> {
    const business_id = resolve_effective_business_id(current_user);
    await this.contacts_validation_service.get_contact_in_business(
      business_id,
      contact_id,
    );

    const [assignments, total_assignments] = await Promise.all([
      this.contact_branch_assignments_repository.find_all_by_contact_in_business(
        business_id,
        contact_id,
        resolve_effective_branch_scope_ids(current_user),
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
        this.contact_branch_assignment_serializer.serialize(assignment),
      ),
    };
  }
}
