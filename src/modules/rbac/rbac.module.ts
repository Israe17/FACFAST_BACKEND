import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Business } from '../common/entities/business.entity';
import { UserRole } from '../users/entities/user-role.entity';
import { PermissionsController } from './controllers/permissions.controller';
import { RolesController } from './controllers/roles.controller';
import { Permission } from './entities/permission.entity';
import { RolePermission } from './entities/role-permission.entity';
import { Role } from './entities/role.entity';
import { PermissionsRepository } from './repositories/permissions.repository';
import { RolesRepository } from './repositories/roles.repository';
import { PermissionsService } from './services/permissions.service';
import { RbacSeedService } from './services/rbac-seed.service';
import { RbacService } from './services/rbac.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Business,
      Role,
      Permission,
      RolePermission,
      UserRole,
    ]),
  ],
  controllers: [RolesController, PermissionsController],
  providers: [
    PermissionsRepository,
    RolesRepository,
    PermissionsService,
    RbacService,
    RbacSeedService,
  ],
  exports: [
    PermissionsRepository,
    RolesRepository,
    RbacSeedService,
    RbacService,
  ],
})
export class RbacModule {}
