import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BranchesModule } from '../branches/branches.module';
import { BusinessesModule } from '../businesses/businesses.module';
import { InventoryMovementHeader } from '../inventory/entities/inventory-movement-header.entity';
import { InventoryMovement } from '../inventory/entities/inventory-movement.entity';
import { SerialEvent } from '../inventory/entities/serial-event.entity';
import { RbacModule } from '../rbac/rbac.module';
import { UsersController } from './controllers/users.controller';
import { UserBranchAccess } from './entities/user-branch-access.entity';
import { UserRole } from './entities/user-role.entity';
import { User } from './entities/user.entity';
import { UserManagementPolicy } from './policies/user-management.policy';
import { UsersRepository } from './repositories/users.repository';
import { UsersService } from './services/users.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      UserRole,
      UserBranchAccess,
      InventoryMovementHeader,
      InventoryMovement,
      SerialEvent,
    ]),
    RbacModule,
    BranchesModule,
    BusinessesModule,
  ],
  controllers: [UsersController],
  providers: [UsersRepository, UserManagementPolicy, UsersService],
  exports: [UsersRepository, UsersService],
})
export class UsersModule {}
