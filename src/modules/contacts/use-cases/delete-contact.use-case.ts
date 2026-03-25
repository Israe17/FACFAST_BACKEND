import { Injectable } from '@nestjs/common';
import { CommandUseCase } from '../../common/application/interfaces/command-use-case.interface';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { ContactLifecyclePolicy } from '../policies/contact-lifecycle.policy';
import { ContactsRepository } from '../repositories/contacts.repository';
import { ContactsValidationService } from '../services/contacts-validation.service';

export type DeleteContactCommand = {
  current_user: AuthenticatedUserContext;
  contact_id: number;
};

export type DeleteContactResult = {
  id: number;
  deleted: true;
};

@Injectable()
export class DeleteContactUseCase
  implements CommandUseCase<DeleteContactCommand, DeleteContactResult>
{
  constructor(
    private readonly contacts_validation_service: ContactsValidationService,
    private readonly contact_lifecycle_policy: ContactLifecyclePolicy,
    private readonly contacts_repository: ContactsRepository,
  ) {}

  async execute({
    current_user,
    contact_id,
  }: DeleteContactCommand): Promise<DeleteContactResult> {
    const business_id = resolve_effective_business_id(current_user);
    const contact = await this.contacts_validation_service.get_contact_in_business(
      business_id,
      contact_id,
    );
    const dependencies =
      await this.contacts_validation_service.count_contact_delete_dependencies(
        business_id,
        contact_id,
      );

    this.contact_lifecycle_policy.assert_deletable(contact, dependencies);
    await this.contacts_repository.remove(contact);
    return {
      id: contact_id,
      deleted: true,
    };
  }
}
