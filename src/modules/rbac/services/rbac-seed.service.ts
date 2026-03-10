import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from '../../common/entities/business.entity';
import { PermissionKey } from '../../common/enums/permission-key.enum';
import { Permission } from '../entities/permission.entity';
import { RolePermission } from '../entities/role-permission.entity';
import { PermissionsRepository } from '../repositories/permissions.repository';
import { RolesRepository } from '../repositories/roles.repository';

type PermissionSeed = Pick<
  Permission,
  'key' | 'module' | 'action' | 'description'
>;

const inventory_permissions: PermissionSeed[] = [
  {
    key: PermissionKey.CATEGORIES_VIEW,
    module: 'categories',
    action: 'view',
    description: 'Can view product categories.',
  },
  {
    key: PermissionKey.CATEGORIES_CREATE,
    module: 'categories',
    action: 'create',
    description: 'Can create product categories.',
  },
  {
    key: PermissionKey.CATEGORIES_UPDATE,
    module: 'categories',
    action: 'update',
    description: 'Can update product categories.',
  },
  {
    key: PermissionKey.BRANDS_VIEW,
    module: 'brands',
    action: 'view',
    description: 'Can view brands.',
  },
  {
    key: PermissionKey.BRANDS_CREATE,
    module: 'brands',
    action: 'create',
    description: 'Can create brands.',
  },
  {
    key: PermissionKey.BRANDS_UPDATE,
    module: 'brands',
    action: 'update',
    description: 'Can update brands.',
  },
  {
    key: PermissionKey.MEASUREMENT_UNITS_VIEW,
    module: 'measurement_units',
    action: 'view',
    description: 'Can view measurement units.',
  },
  {
    key: PermissionKey.MEASUREMENT_UNITS_CREATE,
    module: 'measurement_units',
    action: 'create',
    description: 'Can create measurement units.',
  },
  {
    key: PermissionKey.MEASUREMENT_UNITS_UPDATE,
    module: 'measurement_units',
    action: 'update',
    description: 'Can update measurement units.',
  },
  {
    key: PermissionKey.TAX_PROFILES_VIEW,
    module: 'tax_profiles',
    action: 'view',
    description: 'Can view tax profiles.',
  },
  {
    key: PermissionKey.TAX_PROFILES_CREATE,
    module: 'tax_profiles',
    action: 'create',
    description: 'Can create tax profiles.',
  },
  {
    key: PermissionKey.TAX_PROFILES_UPDATE,
    module: 'tax_profiles',
    action: 'update',
    description: 'Can update tax profiles.',
  },
  {
    key: PermissionKey.PRODUCTS_VIEW,
    module: 'products',
    action: 'view',
    description: 'Can view products.',
  },
  {
    key: PermissionKey.PRODUCTS_CREATE,
    module: 'products',
    action: 'create',
    description: 'Can create products.',
  },
  {
    key: PermissionKey.PRODUCTS_UPDATE,
    module: 'products',
    action: 'update',
    description: 'Can update products.',
  },
  {
    key: PermissionKey.PRICE_LISTS_VIEW,
    module: 'price_lists',
    action: 'view',
    description: 'Can view price lists.',
  },
  {
    key: PermissionKey.PRICE_LISTS_CREATE,
    module: 'price_lists',
    action: 'create',
    description: 'Can create price lists.',
  },
  {
    key: PermissionKey.PRICE_LISTS_UPDATE,
    module: 'price_lists',
    action: 'update',
    description: 'Can update price lists.',
  },
  {
    key: PermissionKey.PRODUCT_PRICES_VIEW,
    module: 'product_prices',
    action: 'view',
    description: 'Can view product prices.',
  },
  {
    key: PermissionKey.PRODUCT_PRICES_CREATE,
    module: 'product_prices',
    action: 'create',
    description: 'Can create product prices.',
  },
  {
    key: PermissionKey.PRODUCT_PRICES_UPDATE,
    module: 'product_prices',
    action: 'update',
    description: 'Can update product prices.',
  },
  {
    key: PermissionKey.WARRANTY_PROFILES_VIEW,
    module: 'warranty_profiles',
    action: 'view',
    description: 'Can view warranty profiles.',
  },
  {
    key: PermissionKey.WARRANTY_PROFILES_CREATE,
    module: 'warranty_profiles',
    action: 'create',
    description: 'Can create warranty profiles.',
  },
  {
    key: PermissionKey.WARRANTY_PROFILES_UPDATE,
    module: 'warranty_profiles',
    action: 'update',
    description: 'Can update warranty profiles.',
  },
  {
    key: PermissionKey.PROMOTIONS_VIEW,
    module: 'promotions',
    action: 'view',
    description: 'Can view promotions.',
  },
  {
    key: PermissionKey.PROMOTIONS_CREATE,
    module: 'promotions',
    action: 'create',
    description: 'Can create promotions.',
  },
  {
    key: PermissionKey.PROMOTIONS_UPDATE,
    module: 'promotions',
    action: 'update',
    description: 'Can update promotions.',
  },
  {
    key: PermissionKey.WAREHOUSES_VIEW,
    module: 'warehouses',
    action: 'view',
    description: 'Can view warehouses.',
  },
  {
    key: PermissionKey.WAREHOUSES_CREATE,
    module: 'warehouses',
    action: 'create',
    description: 'Can create warehouses.',
  },
  {
    key: PermissionKey.WAREHOUSES_UPDATE,
    module: 'warehouses',
    action: 'update',
    description: 'Can update warehouses.',
  },
  {
    key: PermissionKey.WAREHOUSE_LOCATIONS_VIEW,
    module: 'warehouse_locations',
    action: 'view',
    description: 'Can view warehouse locations.',
  },
  {
    key: PermissionKey.WAREHOUSE_LOCATIONS_CREATE,
    module: 'warehouse_locations',
    action: 'create',
    description: 'Can create warehouse locations.',
  },
  {
    key: PermissionKey.WAREHOUSE_LOCATIONS_UPDATE,
    module: 'warehouse_locations',
    action: 'update',
    description: 'Can update warehouse locations.',
  },
  {
    key: PermissionKey.WAREHOUSE_STOCK_VIEW,
    module: 'warehouse_stock',
    action: 'view',
    description: 'Can view warehouse stock.',
  },
  {
    key: PermissionKey.INVENTORY_LOTS_VIEW,
    module: 'inventory_lots',
    action: 'view',
    description: 'Can view inventory lots.',
  },
  {
    key: PermissionKey.INVENTORY_LOTS_CREATE,
    module: 'inventory_lots',
    action: 'create',
    description: 'Can create inventory lots.',
  },
  {
    key: PermissionKey.INVENTORY_LOTS_UPDATE,
    module: 'inventory_lots',
    action: 'update',
    description: 'Can update inventory lots.',
  },
  {
    key: PermissionKey.INVENTORY_MOVEMENTS_VIEW,
    module: 'inventory_movements',
    action: 'view',
    description: 'Can view inventory movements.',
  },
  {
    key: PermissionKey.INVENTORY_MOVEMENTS_ADJUST,
    module: 'inventory_movements',
    action: 'adjust',
    description: 'Can register manual inventory adjustments.',
  },
];

const base_permissions: PermissionSeed[] = [
  {
    key: 'auth.login',
    module: 'auth',
    action: 'login',
    description: 'Can sign in.',
  },
  {
    key: 'auth.refresh',
    module: 'auth',
    action: 'refresh',
    description: 'Can refresh sessions.',
  },
  {
    key: 'users.view',
    module: 'users',
    action: 'view',
    description: 'Can view users.',
  },
  {
    key: 'users.create',
    module: 'users',
    action: 'create',
    description: 'Can create users.',
  },
  {
    key: 'users.update',
    module: 'users',
    action: 'update',
    description: 'Can update users.',
  },
  {
    key: 'users.delete',
    module: 'users',
    action: 'delete',
    description: 'Can delete users.',
  },
  {
    key: 'users.assign_roles',
    module: 'users',
    action: 'assign_roles',
    description: 'Can assign user roles.',
  },
  {
    key: 'users.assign_branches',
    module: 'users',
    action: 'assign_branches',
    description: 'Can assign branch access.',
  },
  {
    key: 'users.change_status',
    module: 'users',
    action: 'change_status',
    description: 'Can change user status.',
  },
  {
    key: 'users.change_password',
    module: 'users',
    action: 'change_password',
    description: 'Can change user password.',
  },
  {
    key: 'roles.view',
    module: 'roles',
    action: 'view',
    description: 'Can view roles.',
  },
  {
    key: 'roles.create',
    module: 'roles',
    action: 'create',
    description: 'Can create roles.',
  },
  {
    key: 'roles.update',
    module: 'roles',
    action: 'update',
    description: 'Can update roles.',
  },
  {
    key: 'roles.delete',
    module: 'roles',
    action: 'delete',
    description: 'Can delete roles.',
  },
  {
    key: 'roles.assign_permissions',
    module: 'roles',
    action: 'assign_permissions',
    description: 'Can assign role permissions.',
  },
  {
    key: 'permissions.view',
    module: 'permissions',
    action: 'view',
    description: 'Can view permissions.',
  },
  {
    key: 'contacts.view',
    module: 'contacts',
    action: 'view',
    description: 'Can view contacts.',
  },
  {
    key: 'contacts.create',
    module: 'contacts',
    action: 'create',
    description: 'Can create contacts.',
  },
  {
    key: 'contacts.update',
    module: 'contacts',
    action: 'update',
    description: 'Can update contacts.',
  },
  {
    key: 'branches.view',
    module: 'branches',
    action: 'view',
    description: 'Can view branches.',
  },
  {
    key: 'branches.create',
    module: 'branches',
    action: 'create',
    description: 'Can create branches.',
  },
  {
    key: 'branches.update',
    module: 'branches',
    action: 'update',
    description: 'Can update branches.',
  },
  {
    key: 'branches.configure',
    module: 'branches',
    action: 'configure',
    description: 'Can configure branch secrets.',
  },
  {
    key: 'branches.create_terminal',
    module: 'branches',
    action: 'create_terminal',
    description: 'Can create terminals.',
  },
  {
    key: 'branches.update_terminal',
    module: 'branches',
    action: 'update_terminal',
    description: 'Can update terminals.',
  },
  ...inventory_permissions,
];

const suggested_role_permissions: Record<string, string[]> = {
  owner: base_permissions.map((permission) => permission.key),
  admin: base_permissions
    .filter((permission) => permission.key !== 'users.delete')
    .map((permission) => permission.key),
  branch_manager: [
    'auth.login',
    'auth.refresh',
    'users.view',
    'users.update',
    'contacts.view',
    'contacts.create',
    'contacts.update',
    'branches.view',
    'branches.update',
    'branches.create_terminal',
    'branches.update_terminal',
  ],
  cashier: [
    'auth.login',
    'auth.refresh',
    'contacts.view',
    'contacts.create',
    'contacts.update',
    'branches.view',
  ],
  purchasing: [
    'auth.login',
    'auth.refresh',
    'contacts.view',
    'contacts.create',
    'contacts.update',
    'branches.view',
  ],
  accountant: ['auth.login', 'auth.refresh', 'contacts.view', 'branches.view'],
  e_invoicing_operator: [
    'auth.login',
    'auth.refresh',
    'contacts.view',
    'contacts.create',
    'contacts.update',
    'branches.view',
  ],
  auditor_readonly: [
    'contacts.view',
    'users.view',
    'roles.view',
    'permissions.view',
    'branches.view',
  ],
};

@Injectable()
export class RbacSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(RbacSeedService.name);

  constructor(
    private readonly permissions_repository: PermissionsRepository,
    private readonly roles_repository: RolesRepository,
    @InjectRepository(RolePermission)
    private readonly role_permission_repository: Repository<RolePermission>,
    @InjectRepository(Business)
    private readonly business_repository: Repository<Business>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.seed_base_permissions();
    const businesses = await this.business_repository.find();
    for (const business of businesses) {
      await this.ensure_suggested_roles_for_business(business.id);
    }
  }

  async seed_base_permissions(): Promise<Permission[]> {
    const persisted_permissions: Permission[] = [];

    for (const permission_seed of base_permissions) {
      let permission = await this.permissions_repository.find_by_key(
        permission_seed.key,
      );
      if (!permission) {
        permission = this.permissions_repository.create(permission_seed);
      } else {
        permission.module = permission_seed.module;
        permission.action = permission_seed.action;
        permission.description = permission_seed.description;
      }

      persisted_permissions.push(
        await this.permissions_repository.save(permission),
      );
    }

    this.logger.log(`Seeded ${persisted_permissions.length} base permissions.`);
    return persisted_permissions;
  }

  async ensure_suggested_roles_for_business(
    business_id: number,
  ): Promise<void> {
    const permissions = await this.permissions_repository.find_all();
    const permissions_by_key = new Map(
      permissions.map((permission) => [permission.key, permission]),
    );

    for (const [role_key, permission_keys] of Object.entries(
      suggested_role_permissions,
    )) {
      let role = await this.roles_repository.find_by_role_key(
        business_id,
        role_key,
      );
      if (!role) {
        role = this.roles_repository.create({
          business_id,
          name: role_key
            .split('_')
            .map((segment) => segment[0].toUpperCase() + segment.slice(1))
            .join(' '),
          role_key,
          is_system: true,
        });
        role = await this.roles_repository.save(role);
      }

      const existing_permission_ids = new Set(
        role.role_permissions?.map(
          (role_permission) => role_permission.permission_id,
        ) ?? [],
      );

      for (const permission_key of permission_keys) {
        const permission = permissions_by_key.get(permission_key);
        if (!permission || existing_permission_ids.has(permission.id)) {
          continue;
        }

        await this.role_permission_repository.save(
          this.role_permission_repository.create({
            role_id: role.id,
            permission_id: permission.id,
          }),
        );
      }
    }
  }
}
