import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BranchesModule } from '../branches/branches.module';
import { InventoryLot } from '../inventory/entities/inventory-lot.entity';
import { PriceList } from '../inventory/entities/price-list.entity';
import { SerialEvent } from '../inventory/entities/serial-event.entity';
import { UsersModule } from '../users/users.module';
import { ContactBranchAssignmentsController } from './controllers/contact-branch-assignments.controller';
import { ContactsController } from './controllers/contacts.controller';
import { ContactBranchAssignment } from './entities/contact-branch-assignment.entity';
import { Contact } from './entities/contact.entity';
import { ContactBranchAssignmentsRepository } from './repositories/contact-branch-assignments.repository';
import { ContactsRepository } from './repositories/contacts.repository';
import { ContactBranchAssignmentsService } from './services/contact-branch-assignments.service';
import { ContactsService } from './services/contacts.service';

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
  controllers: [ContactsController, ContactBranchAssignmentsController],
  providers: [
    ContactsRepository,
    ContactBranchAssignmentsRepository,
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
