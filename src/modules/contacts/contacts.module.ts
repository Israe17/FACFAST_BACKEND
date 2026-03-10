import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContactsController } from './controllers/contacts.controller';
import { Contact } from './entities/contact.entity';
import { ContactsRepository } from './repositories/contacts.repository';
import { ContactsService } from './services/contacts.service';

@Module({
  imports: [TypeOrmModule.forFeature([Contact])],
  controllers: [ContactsController],
  providers: [ContactsRepository, ContactsService],
  exports: [ContactsRepository, ContactsService],
})
export class ContactsModule {}
