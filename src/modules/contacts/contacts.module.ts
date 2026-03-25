import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BranchesModule } from '../branches/branches.module';
import { InventoryLot } from '../inventory/entities/inventory-lot.entity';
import { PriceList } from '../inventory/entities/price-list.entity';
import { SerialEvent } from '../inventory/entities/serial-event.entity';
import { UsersModule } from '../users/users.module';
import { ContactBranchAssignmentItemsController } from './controllers/contact-branch-assignment-items.controller';
import { ContactBranchAssignmentsController } from './controllers/contact-branch-assignments.controller';
import { ContactsController } from './controllers/contacts.controller';
import { ContactBranchAssignment } from './entities/contact-branch-assignment.entity';
import { Contact } from './entities/contact.entity';
import { ContactBranchAssignmentPolicy } from './policies/contact-branch-assignment.policy';
import { ContactLifecyclePolicy } from './policies/contact-lifecycle.policy';
import { ContactBranchAssignmentsRepository } from './repositories/contact-branch-assignments.repository';
import { ContactsRepository } from './repositories/contacts.repository';
import { ContactBranchAssignmentSerializer } from './serializers/contact-branch-assignment.serializer';
import { ContactSerializer } from './serializers/contact.serializer';
import { ContactBranchAssignmentsService } from './services/contact-branch-assignments.service';
import { ContactsService } from './services/contacts.service';
import { ContactsValidationService } from './services/contacts-validation.service';
import { CreateContactBranchAssignmentUseCase } from './use-cases/create-contact-branch-assignment.use-case';
import { CreateContactUseCase } from './use-cases/create-contact.use-case';
import { DeleteContactBranchAssignmentUseCase } from './use-cases/delete-contact-branch-assignment.use-case';
import { DeleteContactUseCase } from './use-cases/delete-contact.use-case';
import { GetContactBranchAssignmentQueryUseCase } from './use-cases/get-contact-branch-assignment.query.use-case';
import { GetContactBranchAssignmentsQueryUseCase } from './use-cases/get-contact-branch-assignments.query.use-case';
import { GetContactQueryUseCase } from './use-cases/get-contact.query.use-case';
import { GetContactsListQueryUseCase } from './use-cases/get-contacts-list.query.use-case';
import { GetContactsPageQueryUseCase } from './use-cases/get-contacts-page.query.use-case';
import { LookupContactByIdentificationQueryUseCase } from './use-cases/lookup-contact-by-identification.query.use-case';
import { UpdateContactBranchAssignmentUseCase } from './use-cases/update-contact-branch-assignment.use-case';
import { UpdateContactUseCase } from './use-cases/update-contact.use-case';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Contact,
      ContactBranchAssignment,
      PriceList,
      InventoryLot,
      SerialEvent,
    ]),
    BranchesModule,
    UsersModule,
  ],
  controllers: [
    ContactsController,
    ContactBranchAssignmentsController,
    ContactBranchAssignmentItemsController,
  ],
  providers: [
    ContactsRepository,
    ContactBranchAssignmentsRepository,
    ContactSerializer,
    ContactBranchAssignmentSerializer,
    ContactLifecyclePolicy,
    ContactBranchAssignmentPolicy,
    ContactsValidationService,
    GetContactsListQueryUseCase,
    GetContactsPageQueryUseCase,
    GetContactQueryUseCase,
    LookupContactByIdentificationQueryUseCase,
    CreateContactUseCase,
    UpdateContactUseCase,
    DeleteContactUseCase,
    GetContactBranchAssignmentsQueryUseCase,
    GetContactBranchAssignmentQueryUseCase,
    CreateContactBranchAssignmentUseCase,
    UpdateContactBranchAssignmentUseCase,
    DeleteContactBranchAssignmentUseCase,
    ContactsService,
    ContactBranchAssignmentsService,
  ],
  exports: [
    ContactsRepository,
    ContactBranchAssignmentsRepository,
    ContactsService,
    ContactBranchAssignmentsService,
  ],
})
export class ContactsModule {}
