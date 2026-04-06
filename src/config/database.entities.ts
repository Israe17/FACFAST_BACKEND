import { RefreshToken } from '../modules/auth/entities/refresh-token.entity';
import { Branch } from '../modules/branches/entities/branch.entity';
import { Terminal } from '../modules/branches/entities/terminal.entity';
import { Business } from '../modules/common/entities/business.entity';
import { BusinessSequence } from '../modules/common/entities/business-sequence.entity';
import { IdempotencyKey } from '../modules/common/entities/idempotency-key.entity';
import { OutboxEvent } from '../modules/common/entities/outbox-event.entity';
import { Contact } from '../modules/contacts/entities/contact.entity';
import { ContactBranchAssignment } from '../modules/contacts/entities/contact-branch-assignment.entity';
import { Brand } from '../modules/inventory/entities/brand.entity';
import { InventoryBalance } from '../modules/inventory/entities/inventory-balance.entity';
import { InventoryLot } from '../modules/inventory/entities/inventory-lot.entity';
import { InventoryMovement } from '../modules/inventory/entities/inventory-movement.entity';
import { InventoryMovementHeader } from '../modules/inventory/entities/inventory-movement-header.entity';
import { InventoryMovementLine } from '../modules/inventory/entities/inventory-movement-line.entity';
import { InventoryReservation } from '../modules/inventory/entities/inventory-reservation.entity';
import { MeasurementUnit } from '../modules/inventory/entities/measurement-unit.entity';
import { PriceList } from '../modules/inventory/entities/price-list.entity';
import { PriceListBranchAssignment } from '../modules/inventory/entities/price-list-branch-assignment.entity';
import { ProductCategory } from '../modules/inventory/entities/product-category.entity';
import { ProductPrice } from '../modules/inventory/entities/product-price.entity';
import { Product } from '../modules/inventory/entities/product.entity';
import { ProductVariant } from '../modules/inventory/entities/product-variant.entity';
import { ProductSerial } from '../modules/inventory/entities/product-serial.entity';
import { SerialEvent } from '../modules/inventory/entities/serial-event.entity';
import { VariantAttribute } from '../modules/inventory/entities/variant-attribute.entity';
import { VariantAttributeValue } from '../modules/inventory/entities/variant-attribute-value.entity';
import { PromotionItem } from '../modules/inventory/entities/promotion-item.entity';
import { PromotionBranchAssignment } from '../modules/inventory/entities/promotion-branch-assignment.entity';
import { Promotion } from '../modules/inventory/entities/promotion.entity';
import { TaxProfile } from '../modules/inventory/entities/tax-profile.entity';
import { RouteBranchLink } from '../modules/inventory/entities/route-branch-link.entity';
import { VehicleBranchLink } from '../modules/inventory/entities/vehicle-branch-link.entity';
import { WarehouseBranchLink } from '../modules/inventory/entities/warehouse-branch-link.entity';
import { WarehouseLocation } from '../modules/inventory/entities/warehouse-location.entity';
import { WarehouseStock } from '../modules/inventory/entities/warehouse-stock.entity';
import { Warehouse } from '../modules/inventory/entities/warehouse.entity';
import { WarrantyProfile } from '../modules/inventory/entities/warranty-profile.entity';
import { ZoneBranchLink } from '../modules/inventory/entities/zone-branch-link.entity';
import { Zone } from '../modules/inventory/entities/zone.entity';
import { Vehicle } from '../modules/inventory/entities/vehicle.entity';
import { Route } from '../modules/inventory/entities/route.entity';
import { DispatchOrder } from '../modules/inventory/entities/dispatch-order.entity';
import { DispatchStop } from '../modules/inventory/entities/dispatch-stop.entity';
import { DispatchStopLine } from '../modules/inventory/entities/dispatch-stop-line.entity';
import { DispatchExpense } from '../modules/inventory/entities/dispatch-expense.entity';
import { SaleOrder } from '../modules/sales/entities/sale-order.entity';
import { SaleOrderLine } from '../modules/sales/entities/sale-order-line.entity';
import { SaleOrderDeliveryCharge } from '../modules/sales/entities/sale-order-delivery-charge.entity';
import { ElectronicDocument } from '../modules/sales/entities/electronic-document.entity';
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
  BusinessSequence,
  IdempotencyKey,
  OutboxEvent,
  Contact,
  ContactBranchAssignment,
  ProductCategory,
  Brand,
  MeasurementUnit,
  TaxProfile,
  Product,
  ProductVariant,
  VariantAttribute,
  VariantAttributeValue,
  ProductSerial,
  SerialEvent,
  PriceList,
  PriceListBranchAssignment,
  ProductPrice,
  WarrantyProfile,
  Promotion,
  PromotionItem,
  PromotionBranchAssignment,
  Warehouse,
  WarehouseBranchLink,
  WarehouseLocation,
  WarehouseStock,
  InventoryBalance,
  InventoryLot,
  InventoryMovement,
  InventoryMovementHeader,
  InventoryMovementLine,
  InventoryReservation,
  ZoneBranchLink,
  Zone,
  VehicleBranchLink,
  Vehicle,
  RouteBranchLink,
  Route,
  DispatchOrder,
  DispatchStop,
  DispatchStopLine,
  DispatchExpense,
  SaleOrder,
  SaleOrderLine,
  SaleOrderDeliveryCharge,
  ElectronicDocument,
];
