import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { DomainNotFoundException } from '../../common/errors/exceptions/domain-not-found.exception';
import { InventoryLot } from '../../inventory/entities/inventory-lot.entity';
import { InventoryMovementHeader } from '../../inventory/entities/inventory-movement-header.entity';
import { InventoryMovement } from '../../inventory/entities/inventory-movement.entity';
import { WarehouseBranchLink } from '../../inventory/entities/warehouse-branch-link.entity';
import { WarehouseLocation } from '../../inventory/entities/warehouse-location.entity';
import { WarehouseStock } from '../../inventory/entities/warehouse-stock.entity';
import { Warehouse } from '../../inventory/entities/warehouse.entity';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { Branch } from '../entities/branch.entity';
import { Terminal } from '../entities/terminal.entity';
import { BranchAccessPolicy } from '../policies/branch-access.policy';
import { BranchConfigurationPolicy } from '../policies/branch-configuration.policy';
import { BranchesRepository } from '../repositories/branches.repository';
import { TerminalsRepository } from '../repositories/terminals.repository';

@Injectable()
export class BranchesValidationService {
  constructor(
    private readonly branches_repository: BranchesRepository,
    private readonly terminals_repository: TerminalsRepository,
    private readonly branch_access_policy: BranchAccessPolicy,
    private readonly branch_configuration_policy: BranchConfigurationPolicy,
    @InjectRepository(Warehouse)
    private readonly warehouse_repository: Repository<Warehouse>,
    @InjectRepository(WarehouseLocation)
    private readonly warehouse_location_repository: Repository<WarehouseLocation>,
    @InjectRepository(WarehouseStock)
    private readonly warehouse_stock_repository: Repository<WarehouseStock>,
    @InjectRepository(WarehouseBranchLink)
    private readonly warehouse_branch_link_repository: Repository<WarehouseBranchLink>,
    @InjectRepository(InventoryLot)
    private readonly inventory_lot_repository: Repository<InventoryLot>,
    @InjectRepository(InventoryMovement)
    private readonly inventory_movement_repository: Repository<InventoryMovement>,
    @InjectRepository(InventoryMovementHeader)
    private readonly inventory_movement_header_repository: Repository<InventoryMovementHeader>,
  ) {}

  async get_branch_for_access(
    current_user: AuthenticatedUserContext,
    branch_id: number,
  ): Promise<Branch> {
    const branch = await this.branches_repository.find_by_id_in_business(
      branch_id,
      resolve_effective_business_id(current_user),
    );
    if (!branch) {
      throw new DomainNotFoundException({
        code: 'BRANCH_NOT_FOUND',
        messageKey: 'branches.not_found',
        details: {
          branch_id,
        },
      });
    }

    this.branch_access_policy.assert_can_access_branch(current_user, branch.id);
    return branch;
  }

  async get_terminal_for_access(
    current_user: AuthenticatedUserContext,
    terminal_id: number,
  ): Promise<Terminal> {
    const business_id = resolve_effective_business_id(current_user);
    const terminal =
      await this.terminals_repository.find_by_id_with_branch(terminal_id, business_id);
    if (!terminal || !terminal.branch) {
      throw new DomainNotFoundException({
        code: 'TERMINAL_NOT_FOUND',
        messageKey: 'terminals.not_found',
        details: {
          terminal_id,
        },
      });
    }

    if (terminal.branch.business_id !== business_id) {
      throw new DomainNotFoundException({
        code: 'TERMINAL_NOT_FOUND',
        messageKey: 'terminals.not_found',
        details: {
          terminal_id,
        },
      });
    }

    this.branch_access_policy.assert_can_access_branch(
      current_user,
      terminal.branch_id,
    );
    return terminal;
  }

  assert_configuration_permissions(
    current_user: AuthenticatedUserContext,
    dto: {
      activity_code?: string;
      provider_code?: string;
      cert_path?: string;
      crypto_key?: string;
      hacienda_username?: string;
      hacienda_password?: string;
      mail_key?: string;
      signature_type?: string;
    },
  ): void {
    this.branch_configuration_policy.assert_configuration_permissions(
      current_user,
      dto,
    );
  }

  async count_branch_delete_dependencies(branch: Branch) {
    const [
      warehouses,
      warehouse_locations,
      warehouse_stock,
      warehouse_branch_links,
      inventory_lots,
      inventory_movement_headers,
      inventory_movements,
    ] = await Promise.all([
      this.warehouse_repository.count({
        where: {
          business_id: branch.business_id,
          branch_id: branch.id,
        },
      }),
      this.warehouse_location_repository.count({
        where: {
          business_id: branch.business_id,
          branch_id: branch.id,
        },
      }),
      this.warehouse_stock_repository.count({
        where: {
          business_id: branch.business_id,
          branch_id: branch.id,
        },
      }),
      this.warehouse_branch_link_repository.count({
        where: {
          business_id: branch.business_id,
          branch_id: branch.id,
        },
      }),
      this.inventory_lot_repository.count({
        where: {
          business_id: branch.business_id,
          branch_id: branch.id,
        },
      }),
      this.inventory_movement_header_repository.count({
        where: {
          business_id: branch.business_id,
          branch_id: branch.id,
        },
      }),
      this.inventory_movement_repository.count({
        where: {
          business_id: branch.business_id,
          branch_id: branch.id,
        },
      }),
    ]);

    return {
      warehouses,
      warehouse_locations,
      warehouse_stock,
      warehouse_branch_links,
      inventory_lots,
      inventory_movement_headers,
      inventory_movements,
    };
  }
}
