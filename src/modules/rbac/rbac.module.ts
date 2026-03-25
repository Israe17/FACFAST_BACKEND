import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Business } from '../common/entities/business.entity';
import { UserRole } from '../users/entities/user-role.entity';
import { PermissionsController } from './controllers/permissions.controller';
import { RolesController } from './controllers/roles.controller';
import { Permission } from './entities/permission.entity';
import { RolePermission } from './entities/role-permission.entity';
import { Role } from './entities/role.entity';
import { RoleAccessPolicy } from './policies/role-access.policy';
import { RoleLifecyclePolicy } from './policies/role-lifecycle.policy';
import { PermissionsRepository } from './repositories/permissions.repository';
import { RolesRepository } from './repositories/roles.repository';
import { PermissionSerializer } from './serializers/permission.serializer';
import { RoleSerializer } from './serializers/role.serializer';
import { PermissionsService } from './services/permissions.service';
import { RbacSeedService } from './services/rbac-seed.service';
import { RbacService } from './services/rbac.service';
import { RbacValidationService } from './services/rbac-validation.service';
import { AssignRolePermissionsUseCase } from './use-cases/assign-role-permissions.use-case';
import { CreateRoleUseCase } from './use-cases/create-role.use-case';
import { DeleteRoleUseCase } from './use-cases/delete-role.use-case';
import { GetPermissionsListQueryUseCase } from './use-cases/get-permissions-list.query.use-case';
import { GetRolesListQueryUseCase } from './use-cases/get-roles-list.query.use-case';
import { UpdateRoleUseCase } from './use-cases/update-role.use-case';

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
    PermissionSerializer,
    RoleSerializer,
    RoleAccessPolicy,
    RoleLifecyclePolicy,
    RbacValidationService,
    GetPermissionsListQueryUseCase,
    GetRolesListQueryUseCase,
    CreateRoleUseCase,
    UpdateRoleUseCase,
    DeleteRoleUseCase,
    AssignRolePermissionsUseCase,
    PermissionsService,
    RbacService,
    RbacSeedService,
  ],
  exports: [
    PermissionsRepository,
    RolesRepository,
    RoleAccessPolicy,
    RbacSeedService,
    RbacService,
  ],
})
export class RbacModule {}
