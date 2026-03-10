import { RefreshToken } from '../modules/auth/entities/refresh-token.entity';
import { Branch } from '../modules/branches/entities/branch.entity';
import { Terminal } from '../modules/branches/entities/terminal.entity';
import { Business } from '../modules/common/entities/business.entity';
import { Contact } from '../modules/contacts/entities/contact.entity';
import { Brand } from '../modules/inventory/entities/brand.entity';
import { InventoryLot } from '../modules/inventory/entities/inventory-lot.entity';
import { InventoryMovement } from '../modules/inventory/entities/inventory-movement.entity';
import { MeasurementUnit } from '../modules/inventory/entities/measurement-unit.entity';
import { PriceList } from '../modules/inventory/entities/price-list.entity';
import { ProductCategory } from '../modules/inventory/entities/product-category.entity';
import { ProductPrice } from '../modules/inventory/entities/product-price.entity';
import { Product } from '../modules/inventory/entities/product.entity';
import { PromotionItem } from '../modules/inventory/entities/promotion-item.entity';
import { Promotion } from '../modules/inventory/entities/promotion.entity';
import { TaxProfile } from '../modules/inventory/entities/tax-profile.entity';
import { WarehouseLocation } from '../modules/inventory/entities/warehouse-location.entity';
import { WarehouseStock } from '../modules/inventory/entities/warehouse-stock.entity';
import { Warehouse } from '../modules/inventory/entities/warehouse.entity';
import { WarrantyProfile } from '../modules/inventory/entities/warranty-profile.entity';
import { Permission } from '../modules/rbac/entities/permission.entity';
import { RolePermission } from '../modules/rbac/entities/role-permission.entity';
import { Role } from '../modules/rbac/entities/role.entity';
import { UserBranchAccess } from '../modules/users/entities/user-branch-access.entity';
import { UserRole } from '../modules/users/entities/user-role.entity';
import { User } from '../modules/users/entities/user.entity';

export const database_entities = [
  Business,
  User,
  Role,
  Permission,
  UserRole,
  RolePermission,
  UserBranchAccess,
  RefreshToken,
  Branch,
  Terminal,
  Contact,
  ProductCategory,
  Brand,
  MeasurementUnit,
  TaxProfile,
  Product,
  PriceList,
  ProductPrice,
  WarrantyProfile,
  Promotion,
  PromotionItem,
  Warehouse,
  WarehouseLocation,
  WarehouseStock,
  InventoryLot,
  InventoryMovement,
];
