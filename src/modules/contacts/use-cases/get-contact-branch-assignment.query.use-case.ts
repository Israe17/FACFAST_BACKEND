import { Injectable } from '@nestjs/common';
import { QueryUseCase } from '../../common/application/interfaces/query-use-case.interface';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { ContactBranchAssignmentView } from '../contracts/contact-branch-assignment.view';
import { ContactBranchAssignmentSerializer } from '../serializers/contact-branch-assignment.serializer';
import { ContactsValidationService } from '../services/contacts-validation.service';

export type GetContactBranchAssignmentQuery = {
  current_user: AuthenticatedUserContext;
  assignment_id: number;
};

@Injectable()
export class GetContactBranchAssignmentQueryUseCase
  implements QueryUseCase<GetContactBranchAssignmentQuery, ContactBranchAssignmentView>
{
  constructor(
    private readonly contacts_validation_service: ContactsValidationService,
    private readonly contact_branch_assignment_serializer: ContactBranchAssignmentSerializer,
  ) {}

  async execute({
    current_user,
    assignment_id,
  }: GetContactBranchAssignmentQuery): Promise<ContactBranchAssignmentView> {
    const business_id = resolve_effective_business_id(current_user);
    const assignment =
      await this.contacts_validation_service.get_contact_branch_assignment_in_business(
        business_id,
        assignment_id,
      );
    await this.contacts_validation_service.get_branch_for_assignment_access(
      current_user,
      business_id,
      assignment.branch_id,
    );

    return this.contact_branch_assignment_serializer.serialize(assignment);
  }
}
