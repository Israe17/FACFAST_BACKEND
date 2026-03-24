import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Business } from '../../common/entities/business.entity';
import { PermissionKey } from '../../common/enums/permission-key.enum';
import { EntityCodeService } from '../../common/services/entity-code.service';
import { Permission } from '../entities/permission.entity';
import { RolePermission } from '../entities/role-permission.entity';
import { Role } from '../entities/role.entity';
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
    key: PermissionKey.CATEGORIES_DELETE,
    module: 'categories',
    action: 'delete',
    description: 'Can delete product categories.',
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
    key: PermissionKey.BRANDS_DELETE,
    module: 'brands',
    action: 'delete',
    description: 'Can delete brands.',
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
    key: PermissionKey.MEASUREMENT_UNITS_DELETE,
    module: 'measurement_units',
    action: 'delete',
    description: 'Can delete measurement units.',
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
    key: PermissionKey.PRODUCTS_DELETE,
    module: 'products',
    action: 'delete',
    description: 'Can deactivate products.',
  },
  {
    key: PermissionKey.PRODUCT_VARIANTS_VIEW,
    module: 'product_variants',
    action: 'view',
    description: 'Can view product variants.',
  },
  {
    key: PermissionKey.PRODUCT_VARIANTS_CREATE,
    module: 'product_variants',
    action: 'create',
    description: 'Can create product variants.',
  },
  {
    key: PermissionKey.PRODUCT_VARIANTS_UPDATE,
    module: 'product_variants',
    action: 'update',
    description: 'Can update product variants.',
  },
  {
    key: PermissionKey.PRODUCT_VARIANTS_DELETE,
    module: 'product_variants',
    action: 'delete',
    description:
      'Can deactivate or permanently delete product variants when allowed.',
  },
  {
    key: PermissionKey.VARIANT_ATTRIBUTES_VIEW,
    module: 'variant_attributes',
    action: 'view',
    description: 'Can view variant attribute definitions.',
  },
  {
    key: PermissionKey.VARIANT_ATTRIBUTES_CONFIGURE,
    module: 'variant_attributes',
    action: 'configure',
    description: 'Can configure variant attributes.',
  },
  {
    key: PermissionKey.VARIANT_ATTRIBUTES_GENERATE,
    module: 'variant_attributes',
    action: 'generate',
    description: 'Can generate variants from attribute combinations.',
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
    key: PermissionKey.PRICE_LISTS_DELETE,
    module: 'price_lists',
    action: 'delete',
    description: 'Can delete price lists.',
  },
  {
    key: PermissionKey.PRICE_LISTS_VIEW_BRANCH_ASSIGNMENTS,
    module: 'price_lists',
    action: 'view_branch_assignments',
    description: 'Can view branch assignments for price lists.',
  },
  {
    key: PermissionKey.PRICE_LISTS_CREATE_BRANCH_ASSIGNMENT,
    module: 'price_lists',
    action: 'create_branch_assignment',
    description: 'Can create branch assignments for price lists.',
  },
  {
    key: PermissionKey.PRICE_LISTS_UPDATE_BRANCH_ASSIGNMENT,
    module: 'price_lists',
    action: 'update_branch_assignment',
    description: 'Can update branch assignments for price lists.',
  },
  {
    key: PermissionKey.PRICE_LISTS_DELETE_BRANCH_ASSIGNMENT,
    module: 'price_lists',
    action: 'delete_branch_assignment',
    description: 'Can delete branch assignments for price lists.',
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
    key: PermissionKey.PRODUCT_PRICES_DELETE,
    module: 'product_prices',
    action: 'delete',
    description: 'Can delete product prices.',
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
    key: PermissionKey.WARRANTY_PROFILES_DELETE,
    module: 'warranty_profiles',
    action: 'delete',
    description: 'Can delete warranty profiles.',
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
    key: PermissionKey.PROMOTIONS_DELETE,
    module: 'promotions',
    action: 'delete',
    description: 'Can delete promotions.',
  },
  {
    key: PermissionKey.PROMOTIONS_VIEW_BRANCH_ASSIGNMENTS,
    module: 'promotions',
    action: 'view_branch_assignments',
    description: 'Can view branch assignments for promotions.',
  },
  {
    key: PermissionKey.PROMOTIONS_CREATE_BRANCH_ASSIGNMENT,
    module: 'promotions',
    action: 'create_branch_assignment',
    description: 'Can create branch assignments for promotions.',
  },
  {
    key: PermissionKey.PROMOTIONS_UPDATE_BRANCH_ASSIGNMENT,
    module: 'promotions',
    action: 'update_branch_assignment',
    description: 'Can update branch assignments for promotions.',
  },
  {
    key: PermissionKey.PROMOTIONS_DELETE_BRANCH_ASSIGNMENT,
    module: 'promotions',
    action: 'delete_branch_assignment',
    description: 'Can delete branch assignments for promotions.',
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
    key: PermissionKey.WAREHOUSES_DELETE,
    module: 'warehouses',
    action: 'delete',
    description: 'Can deactivate warehouses.',
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
    key: PermissionKey.INVENTORY_LOTS_DELETE,
    module: 'inventory_lots',
    action: 'delete',
    description: 'Can deactivate inventory lots.',
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
  {
    key: PermissionKey.INVENTORY_MOVEMENTS_TRANSFER,
    module: 'inventory_movements',
    action: 'transfer',
    description: 'Can register inventory transfers between warehouses.',
  },
  {
    key: PermissionKey.INVENTORY_MOVEMENTS_CANCEL,
    module: 'inventory_movements',
    action: 'cancel',
    description: 'Can cancel posted inventory movements.',
  },
  {
    key: PermissionKey.PRODUCT_SERIALS_VIEW,
    module: 'product_serials',
    action: 'view',
    description: 'Can view product serials and their history.',
  },
  {
    key: PermissionKey.PRODUCT_SERIALS_CREATE,
    module: 'product_serials',
    action: 'create',
    description: 'Can register product serials.',
  },
  {
    key: PermissionKey.PRODUCT_SERIALS_UPDATE,
    module: 'product_serials',
    action: 'update',
    description: 'Can update product serial status and notes.',
  },
  {
    key: PermissionKey.ZONES_VIEW,
    module: 'zones',
    action: 'view',
    description: 'Can view zones.',
  },
  {
    key: PermissionKey.ZONES_CREATE,
    module: 'zones',
    action: 'create',
    description: 'Can create zones.',
  },
  {
    key: PermissionKey.ZONES_UPDATE,
    module: 'zones',
    action: 'update',
    description: 'Can update zones.',
  },
  {
    key: PermissionKey.ZONES_DELETE,
    module: 'zones',
    action: 'delete',
    description: 'Can delete zones.',
  },
  {
    key: PermissionKey.VEHICLES_VIEW,
    module: 'vehicles',
    action: 'view',
    description: 'Can view vehicles.',
  },
  {
    key: PermissionKey.VEHICLES_CREATE,
    module: 'vehicles',
    action: 'create',
    description: 'Can create vehicles.',
  },
  {
    key: PermissionKey.VEHICLES_UPDATE,
    module: 'vehicles',
    action: 'update',
    description: 'Can update vehicles.',
  },
  {
    key: PermissionKey.VEHICLES_DELETE,
    module: 'vehicles',
    action: 'delete',
    description: 'Can delete vehicles.',
  },
  {
    key: PermissionKey.ROUTES_VIEW,
    module: 'routes',
    action: 'view',
    description: 'Can view routes.',
  },
  {
    key: PermissionKey.ROUTES_CREATE,
    module: 'routes',
    action: 'create',
    description: 'Can create routes.',
  },
  {
    key: PermissionKey.ROUTES_UPDATE,
    module: 'routes',
    action: 'update',
    description: 'Can update routes.',
  },
  {
    key: PermissionKey.ROUTES_DELETE,
    module: 'routes',
    action: 'delete',
    description: 'Can delete routes.',
  },
];

const sales_permissions: PermissionSeed[] = [
  {
    key: PermissionKey.SALE_ORDERS_VIEW,
    module: 'sale_orders',
    action: 'view',
    description: 'Can view sale orders.',
  },
  {
    key: PermissionKey.SALE_ORDERS_CREATE,
    module: 'sale_orders',
    action: 'create',
    description: 'Can create sale orders.',
  },
  {
    key: PermissionKey.SALE_ORDERS_UPDATE,
    module: 'sale_orders',
    action: 'update',
    description: 'Can update sale orders.',
  },
  {
    key: PermissionKey.SALE_ORDERS_CONFIRM,
    module: 'sale_orders',
    action: 'confirm',
    description: 'Can confirm sale orders.',
  },
  {
    key: PermissionKey.SALE_ORDERS_CANCEL,
    module: 'sale_orders',
    action: 'cancel',
    description: 'Can cancel sale orders.',
  },
  {
    key: PermissionKey.SALE_ORDERS_DELETE,
    module: 'sale_orders',
    action: 'delete',
    description: 'Can delete draft sale orders.',
  },
  {
    key: PermissionKey.ELECTRONIC_DOCUMENTS_VIEW,
    module: 'electronic_documents',
    action: 'view',
    description: 'Can view electronic documents.',
  },
  {
    key: PermissionKey.ELECTRONIC_DOCUMENTS_EMIT,
    module: 'electronic_documents',
    action: 'emit',
    description: 'Can emit electronic documents.',
  },
];

const dispatch_permissions: PermissionSeed[] = [
  {
    key: PermissionKey.DISPATCH_ORDERS_VIEW,
    module: 'dispatch_orders',
    action: 'view',
    description: 'Can view dispatch orders.',
  },
  {
    key: PermissionKey.DISPATCH_ORDERS_CREATE,
    module: 'dispatch_orders',
    action: 'create',
    description: 'Can create dispatch orders.',
  },
  {
    key: PermissionKey.DISPATCH_ORDERS_UPDATE,
    module: 'dispatch_orders',
    action: 'update',
    description: 'Can update dispatch orders.',
  },
  {
    key: PermissionKey.DISPATCH_ORDERS_CANCEL,
    module: 'dispatch_orders',
    action: 'cancel',
    description: 'Can cancel dispatch orders.',
  },
  {
    key: PermissionKey.DISPATCH_EXPENSES_CREATE,
    module: 'dispatch_expenses',
    action: 'create',
    description: 'Can create dispatch expenses.',
  },
  {
    key: PermissionKey.DISPATCH_EXPENSES_DELETE,
    module: 'dispatch_expenses',
    action: 'delete',
    description: 'Can delete dispatch expenses.',
  },
];

const base_permissions: PermissionSeed[] = [
  {
    key: PermissionKey.AUTH_LOGIN,
    module: 'auth',
    action: 'login',
    description: 'Can sign in.',
  },
  {
    key: PermissionKey.AUTH_REFRESH,
    module: 'auth',
    action: 'refresh',
    description: 'Can refresh sessions.',
  },
  {
    key: PermissionKey.BUSINESSES_VIEW,
    module: 'businesses',
    action: 'view',
    description: 'Can view the current business profile.',
  },
  {
    key: PermissionKey.BUSINESSES_UPDATE,
    module: 'businesses',
    action: 'update',
    description: 'Can update the current business profile.',
  },
  {
    key: PermissionKey.USERS_VIEW,
    module: 'users',
    action: 'view',
    description: 'Can view users.',
  },
  {
    key: PermissionKey.USERS_CREATE,
    module: 'users',
    action: 'create',
    description: 'Can create users.',
  },
  {
    key: PermissionKey.USERS_UPDATE,
    module: 'users',
    action: 'update',
    description: 'Can update users.',
  },
  {
    key: PermissionKey.USERS_DELETE,
    module: 'users',
    action: 'delete',
    description: 'Can delete users.',
  },
  {
    key: PermissionKey.USERS_ASSIGN_ROLES,
    module: 'users',
    action: 'assign_roles',
    description: 'Can assign user roles.',
  },
  {
    key: PermissionKey.USERS_ASSIGN_BRANCHES,
    module: 'users',
    action: 'assign_branches',
    description: 'Can assign branch access.',
  },
  {
    key: PermissionKey.USERS_CHANGE_STATUS,
    module: 'users',
    action: 'change_status',
    description: 'Can change user status.',
  },
  {
    key: PermissionKey.USERS_CHANGE_PASSWORD,
    module: 'users',
    action: 'change_password',
    description: 'Can change user password.',
  },
  {
    key: PermissionKey.ROLES_VIEW,
    module: 'roles',
    action: 'view',
    description: 'Can view roles.',
  },
  {
    key: PermissionKey.ROLES_CREATE,
    module: 'roles',
    action: 'create',
    description: 'Can create roles.',
  },
  {
    key: PermissionKey.ROLES_UPDATE,
    module: 'roles',
    action: 'update',
    description: 'Can update roles.',
  },
  {
    key: PermissionKey.ROLES_DELETE,
    module: 'roles',
    action: 'delete',
    description: 'Can delete roles.',
  },
  {
    key: PermissionKey.ROLES_ASSIGN_PERMISSIONS,
    module: 'roles',
    action: 'assign_permissions',
    description: 'Can assign role permissions.',
  },
  {
    key: PermissionKey.PERMISSIONS_VIEW,
    module: 'permissions',
    action: 'view',
    description: 'Can view permissions.',
  },
  {
    key: PermissionKey.CONTACTS_VIEW,
    module: 'contacts',
    action: 'view',
    description: 'Can view contacts.',
  },
  {
    key: PermissionKey.CONTACTS_CREATE,
    module: 'contacts',
    action: 'create',
    description: 'Can create contacts.',
  },
  {
    key: PermissionKey.CONTACTS_UPDATE,
    module: 'contacts',
    action: 'update',
    description: 'Can update contacts.',
  },
  {
    key: PermissionKey.CONTACTS_DELETE,
    module: 'contacts',
    action: 'delete',
    description: 'Can delete contacts.',
  },
  {
    key: PermissionKey.CONTACTS_VIEW_BRANCH_ASSIGNMENTS,
    module: 'contacts',
    action: 'view_branch_assignments',
    description: 'Can view branch assignments for contacts.',
  },
  {
    key: PermissionKey.CONTACTS_CREATE_BRANCH_ASSIGNMENT,
    module: 'contacts',
    action: 'create_branch_assignment',
    description: 'Can create branch assignments for contacts.',
  },
  {
    key: PermissionKey.CONTACTS_UPDATE_BRANCH_ASSIGNMENT,
    module: 'contacts',
    action: 'update_branch_assignment',
    description: 'Can update branch assignments for contacts.',
  },
  {
    key: PermissionKey.CONTACTS_DELETE_BRANCH_ASSIGNMENT,
    module: 'contacts',
    action: 'delete_branch_assignment',
    description: 'Can delete branch assignments for contacts.',
  },
  {
    key: PermissionKey.BRANCHES_VIEW,
    module: 'branches',
    action: 'view',
    description: 'Can view branches.',
  },
  {
    key: PermissionKey.BRANCHES_CREATE,
    module: 'branches',
    action: 'create',
    description: 'Can create branches.',
  },
  {
    key: PermissionKey.BRANCHES_UPDATE,
    module: 'branches',
    action: 'update',
    description: 'Can update branches.',
  },
  {
    key: PermissionKey.BRANCHES_DELETE,
    module: 'branches',
    action: 'delete',
    description: 'Can delete branches.',
  },
  {
    key: PermissionKey.BRANCHES_CONFIGURE,
    module: 'branches',
    action: 'configure',
    description: 'Can configure branch secrets.',
  },
  {
    key: PermissionKey.BRANCHES_CREATE_TERMINAL,
    module: 'branches',
    action: 'create_terminal',
    description: 'Can create terminals.',
  },
  {
    key: PermissionKey.BRANCHES_UPDATE_TERMINAL,
    module: 'branches',
    action: 'update_terminal',
    description: 'Can update terminals.',
  },
  {
    key: PermissionKey.BRANCHES_DELETE_TERMINAL,
    module: 'branches',
    action: 'delete_terminal',
    description: 'Can delete terminals.',
  },
  ...inventory_permissions,
  ...sales_permissions,
  ...dispatch_permissions,
];

const suggested_role_permissions: Record<string, string[]> = {
  owner: base_permissions.map((permission) => permission.key),
  admin: base_permissions
    .filter((permission) => permission.key !== PermissionKey.USERS_DELETE)
    .map((permission) => permission.key),
  branch_manager: [
    PermissionKey.AUTH_LOGIN,
    PermissionKey.AUTH_REFRESH,
    PermissionKey.USERS_VIEW,
    PermissionKey.USERS_UPDATE,
    PermissionKey.CONTACTS_VIEW,
    PermissionKey.CONTACTS_CREATE,
    PermissionKey.CONTACTS_UPDATE,
    PermissionKey.BRANCHES_VIEW,
    PermissionKey.BRANCHES_UPDATE,
    PermissionKey.BRANCHES_CREATE_TERMINAL,
    PermissionKey.BRANCHES_UPDATE_TERMINAL,
  ],
  cashier: [
    PermissionKey.AUTH_LOGIN,
    PermissionKey.AUTH_REFRESH,
    PermissionKey.CONTACTS_VIEW,
    PermissionKey.CONTACTS_CREATE,
    PermissionKey.CONTACTS_UPDATE,
    PermissionKey.BRANCHES_VIEW,
  ],
  purchasing: [
    PermissionKey.AUTH_LOGIN,
    PermissionKey.AUTH_REFRESH,
    PermissionKey.CONTACTS_VIEW,
    PermissionKey.CONTACTS_CREATE,
    PermissionKey.CONTACTS_UPDATE,
    PermissionKey.BRANCHES_VIEW,
  ],
  accountant: [PermissionKey.AUTH_LOGIN, PermissionKey.AUTH_REFRESH, PermissionKey.CONTACTS_VIEW, PermissionKey.BRANCHES_VIEW],
  e_invoicing_operator: [
    PermissionKey.AUTH_LOGIN,
    PermissionKey.AUTH_REFRESH,
    PermissionKey.CONTACTS_VIEW,
    PermissionKey.CONTACTS_CREATE,
    PermissionKey.CONTACTS_UPDATE,
    PermissionKey.BRANCHES_VIEW,
  ],
  auditor_readonly: [
    PermissionKey.CONTACTS_VIEW,
    PermissionKey.USERS_VIEW,
    PermissionKey.ROLES_VIEW,
    PermissionKey.PERMISSIONS_VIEW,
    PermissionKey.BRANCHES_VIEW,
  ],
};

const derived_inventory_permissions: Partial<
  Record<PermissionKey, PermissionKey[]>
> = {
  [PermissionKey.CATEGORIES_UPDATE]: [PermissionKey.CATEGORIES_DELETE],
  [PermissionKey.BRANDS_UPDATE]: [PermissionKey.BRANDS_DELETE],
  [PermissionKey.CONTACTS_VIEW]: [
    PermissionKey.CONTACTS_VIEW_BRANCH_ASSIGNMENTS,
  ],
  [PermissionKey.CONTACTS_UPDATE]: [
    PermissionKey.CONTACTS_DELETE,
    PermissionKey.CONTACTS_CREATE_BRANCH_ASSIGNMENT,
    PermissionKey.CONTACTS_UPDATE_BRANCH_ASSIGNMENT,
    PermissionKey.CONTACTS_DELETE_BRANCH_ASSIGNMENT,
  ],
  [PermissionKey.BRANCHES_UPDATE]: [PermissionKey.BRANCHES_DELETE],
  [PermissionKey.BRANCHES_UPDATE_TERMINAL]: [
    PermissionKey.BRANCHES_DELETE_TERMINAL,
  ],
  [PermissionKey.MEASUREMENT_UNITS_UPDATE]: [
    PermissionKey.MEASUREMENT_UNITS_DELETE,
  ],
  [PermissionKey.PRODUCTS_VIEW]: [
    PermissionKey.PRODUCT_VARIANTS_VIEW,
    PermissionKey.VARIANT_ATTRIBUTES_VIEW,
    PermissionKey.PRODUCT_SERIALS_VIEW,
  ],
  [PermissionKey.PRODUCTS_CREATE]: [
    PermissionKey.PRODUCT_VARIANTS_CREATE,
    PermissionKey.VARIANT_ATTRIBUTES_GENERATE,
    PermissionKey.PRODUCT_SERIALS_CREATE,
  ],
  [PermissionKey.PRODUCTS_UPDATE]: [
    PermissionKey.PRODUCTS_DELETE,
    PermissionKey.PRODUCT_VARIANTS_UPDATE,
    PermissionKey.PRODUCT_VARIANTS_DELETE,
    PermissionKey.VARIANT_ATTRIBUTES_CONFIGURE,
    PermissionKey.PRODUCT_SERIALS_UPDATE,
  ],
  [PermissionKey.PRICE_LISTS_VIEW]: [
    PermissionKey.PRICE_LISTS_VIEW_BRANCH_ASSIGNMENTS,
  ],
  [PermissionKey.PRICE_LISTS_UPDATE]: [
    PermissionKey.PRICE_LISTS_DELETE,
    PermissionKey.PRICE_LISTS_CREATE_BRANCH_ASSIGNMENT,
    PermissionKey.PRICE_LISTS_UPDATE_BRANCH_ASSIGNMENT,
    PermissionKey.PRICE_LISTS_DELETE_BRANCH_ASSIGNMENT,
  ],
  [PermissionKey.PRODUCT_PRICES_UPDATE]: [PermissionKey.PRODUCT_PRICES_DELETE],
  [PermissionKey.WARRANTY_PROFILES_UPDATE]: [
    PermissionKey.WARRANTY_PROFILES_DELETE,
  ],
  [PermissionKey.PROMOTIONS_VIEW]: [
    PermissionKey.PROMOTIONS_VIEW_BRANCH_ASSIGNMENTS,
  ],
  [PermissionKey.PROMOTIONS_UPDATE]: [
    PermissionKey.PROMOTIONS_DELETE,
    PermissionKey.PROMOTIONS_CREATE_BRANCH_ASSIGNMENT,
    PermissionKey.PROMOTIONS_UPDATE_BRANCH_ASSIGNMENT,
    PermissionKey.PROMOTIONS_DELETE_BRANCH_ASSIGNMENT,
  ],
  [PermissionKey.WAREHOUSES_UPDATE]: [PermissionKey.WAREHOUSES_DELETE],
  [PermissionKey.INVENTORY_LOTS_UPDATE]: [PermissionKey.INVENTORY_LOTS_DELETE],
  [PermissionKey.INVENTORY_MOVEMENTS_ADJUST]: [
    PermissionKey.INVENTORY_MOVEMENTS_TRANSFER,
    PermissionKey.INVENTORY_MOVEMENTS_CANCEL,
  ],
  [PermissionKey.ZONES_UPDATE]: [PermissionKey.ZONES_DELETE],
  [PermissionKey.VEHICLES_UPDATE]: [PermissionKey.VEHICLES_DELETE],
  [PermissionKey.ROUTES_UPDATE]: [PermissionKey.ROUTES_DELETE],
  [PermissionKey.SALE_ORDERS_UPDATE]: [
    PermissionKey.SALE_ORDERS_CONFIRM,
    PermissionKey.SALE_ORDERS_CANCEL,
  ],
  [PermissionKey.ELECTRONIC_DOCUMENTS_VIEW]: [
    PermissionKey.ELECTRONIC_DOCUMENTS_EMIT,
  ],
  [PermissionKey.DISPATCH_ORDERS_UPDATE]: [
    PermissionKey.DISPATCH_ORDERS_CANCEL,
    PermissionKey.DISPATCH_EXPENSES_CREATE,
    PermissionKey.DISPATCH_EXPENSES_DELETE,
  ],
};

@Injectable()
export class RbacSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(RbacSeedService.name);
  private readonly role_relations = {
    role_permissions: {
      permission: true,
    },
  } as const;

  constructor(
    private readonly permissions_repository: PermissionsRepository,
    private readonly roles_repository: RolesRepository,
    private readonly entity_code_service: EntityCodeService,
    @InjectRepository(RolePermission)
    private readonly role_permission_repository: Repository<RolePermission>,
    @InjectRepository(Role)
    private readonly role_repository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permission_repository: Repository<Permission>,
    @InjectRepository(Business)
    private readonly business_repository: Repository<Business>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.seed_base_permissions();
    const businesses = await this.business_repository.find();
    for (const business of businesses) {
      await this.ensure_suggested_roles_for_business(business.id);
      await this.ensure_derived_permissions_for_business_roles(business.id);
    }
  }

  async seed_base_permissions(): Promise<Permission[]> {
    return this.seed_base_permissions_in_manager();
  }

  async seed_base_permissions_in_manager(
    manager?: EntityManager,
  ): Promise<Permission[]> {
    const permission_repository =
      manager?.getRepository(Permission) ?? this.permission_repository;
    const persisted_permissions: Permission[] = [];

    for (const permission_seed of base_permissions) {
      let permission = await permission_repository.findOne({
        where: {
          key: permission_seed.key,
        },
      });
      if (!permission) {
        permission = permission_repository.create(permission_seed);
      } else {
        permission.module = permission_seed.module;
        permission.action = permission_seed.action;
        permission.description = permission_seed.description;
      }

      const saved_permission = await permission_repository.save(permission);
      persisted_permissions.push(
        await this.entity_code_service.ensure_code(
          permission_repository,
          saved_permission,
          'PM',
        ),
      );
    }

    this.logger.log(`Seeded ${persisted_permissions.length} base permissions.`);
    return persisted_permissions;
  }

  async ensure_suggested_roles_for_business(
    business_id: number,
  ): Promise<void> {
    return this.ensure_suggested_roles_for_business_in_manager(
      business_id,
      undefined,
    );
  }

  async ensure_suggested_roles_for_business_in_manager(
    business_id: number,
    manager?: EntityManager,
  ): Promise<void> {
    const permission_repository =
      manager?.getRepository(Permission) ?? this.permission_repository;
    const role_repository =
      manager?.getRepository(Role) ?? this.role_repository;
    const role_permission_repository =
      manager?.getRepository(RolePermission) ?? this.role_permission_repository;

    const permissions = await permission_repository.find({
      order: {
        module: 'ASC',
        action: 'ASC',
      },
    });
    const permissions_by_key = new Map(
      permissions.map((permission) => [permission.key, permission]),
    );

    for (const [role_key, permission_keys] of Object.entries(
      suggested_role_permissions,
    )) {
      let role = await role_repository.findOne({
        where: {
          business_id,
          role_key,
        },
        relations: this.role_relations,
      });
      if (!role) {
        role = role_repository.create({
          business_id,
          name: role_key
            .split('_')
            .map((segment) => segment[0].toUpperCase() + segment.slice(1))
            .join(' '),
          role_key,
          is_system: true,
        });
        const saved_role = await role_repository.save(role);
        role = await this.entity_code_service.ensure_code(
          role_repository,
          saved_role,
          'RL',
        );
        role = await role_repository.findOne({
          where: {
            id: role.id,
          },
          relations: this.role_relations,
        });
        if (!role) {
          throw new Error('Could not reload seeded role.');
        }
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

        await role_permission_repository.save(
          role_permission_repository.create({
            role_id: role.id,
            permission_id: permission.id,
          }),
        );
      }
    }
  }

  async ensure_derived_permissions_for_business_roles(
    business_id: number,
  ): Promise<void> {
    return this.ensure_derived_permissions_for_business_roles_in_manager(
      business_id,
      undefined,
    );
  }

  async ensure_derived_permissions_for_business_roles_in_manager(
    business_id: number,
    manager?: EntityManager,
  ): Promise<void> {
    const permission_repository =
      manager?.getRepository(Permission) ?? this.permission_repository;
    const role_repository =
      manager?.getRepository(Role) ?? this.role_repository;
    const role_permission_repository =
      manager?.getRepository(RolePermission) ?? this.role_permission_repository;

    const permissions = await permission_repository.find();
    const permissions_by_key = new Map(
      permissions.map((permission) => [permission.key, permission]),
    );
    const roles = await role_repository.find({
      where: {
        business_id,
      },
      relations: this.role_relations,
    });

    for (const role of roles) {
      const existing_permission_ids = new Set(
        role.role_permissions?.map(
          (role_permission) => role_permission.permission_id,
        ) ?? [],
      );
      const existing_permission_keys = new Set(
        role.role_permissions
          ?.map((role_permission) => role_permission.permission?.key)
          .filter((permission_key): permission_key is string =>
            Boolean(permission_key),
          ) ?? [],
      );

      const permission_ids_to_assign = new Set<number>();

      for (const [source_permission, derived_permissions] of Object.entries(
        derived_inventory_permissions,
      ) as [PermissionKey, PermissionKey[]][]) {
        if (!existing_permission_keys.has(source_permission)) {
          continue;
        }

        for (const derived_permission_key of derived_permissions) {
          const derived_permission = permissions_by_key.get(
            derived_permission_key,
          );
          if (
            !derived_permission ||
            existing_permission_ids.has(derived_permission.id)
          ) {
            continue;
          }
          permission_ids_to_assign.add(derived_permission.id);
        }
      }

      for (const permission_id of permission_ids_to_assign) {
        await role_permission_repository.save(
          role_permission_repository.create({
            role_id: role.id,
            permission_id,
          }),
        );
      }
    }
  }
}
