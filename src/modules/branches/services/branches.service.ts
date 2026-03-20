import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { IdentificationType } from '../../common/enums/identification-type.enum';
import { DomainBadRequestException } from '../../common/errors/exceptions/domain-bad-request.exception';
import { DomainForbiddenException } from '../../common/errors/exceptions/domain-forbidden.exception';
import { DomainNotFoundException } from '../../common/errors/exceptions/domain-not-found.exception';
import { EntityCodeService } from '../../common/services/entity-code.service';
import { EncryptionService } from '../../common/services/encryption.service';
import { InventoryLot } from '../../inventory/entities/inventory-lot.entity';
import { InventoryMovementHeader } from '../../inventory/entities/inventory-movement-header.entity';
import { InventoryMovement } from '../../inventory/entities/inventory-movement.entity';
import { WarehouseBranchLink } from '../../inventory/entities/warehouse-branch-link.entity';
import { WarehouseLocation } from '../../inventory/entities/warehouse-location.entity';
import { WarehouseStock } from '../../inventory/entities/warehouse-stock.entity';
import { Warehouse } from '../../inventory/entities/warehouse.entity';
import {
  resolve_effective_branch_scope_ids,
  resolve_effective_business_id,
} from '../../common/utils/tenant-context.util';
import { CreateBranchDto } from '../dto/create-branch.dto';
import { CreateTerminalDto } from '../dto/create-terminal.dto';
import { UpdateBranchDto } from '../dto/update-branch.dto';
import { UpdateTerminalDto } from '../dto/update-terminal.dto';
import { Branch } from '../entities/branch.entity';
import { Terminal } from '../entities/terminal.entity';
import { BranchAccessPolicy } from '../policies/branch-access.policy';
import { BranchesRepository } from '../repositories/branches.repository';
import { TerminalsRepository } from '../repositories/terminals.repository';
import {
  serialize_branch,
  serialize_terminal,
} from '../utils/serialize-branch.util';

@Injectable()
export class BranchesService {
  constructor(
    private readonly branches_repository: BranchesRepository,
    private readonly terminals_repository: TerminalsRepository,
    private readonly branch_access_policy: BranchAccessPolicy,
    private readonly entity_code_service: EntityCodeService,
    private readonly encryption_service: EncryptionService,
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

  async get_branches(current_user: AuthenticatedUserContext) {
    const branch_ids = resolve_effective_branch_scope_ids(current_user);

    const branches = await this.branches_repository.find_all_by_business(
      resolve_effective_business_id(current_user),
      branch_ids,
    );

    return branches.map((branch) => this.serialize_branch(branch));
  }

  async create_branch(
    current_user: AuthenticatedUserContext,
    dto: CreateBranchDto,
  ) {
    this.assert_branch_configuration_permissions(current_user, dto);

    if (dto.code) {
      this.entity_code_service.validate_code('BR', dto.code);
    }

    const branch = this.branches_repository.create({
      business_id: resolve_effective_business_id(current_user),
      code: dto.code ?? null,
      business_name: dto.business_name.trim(),
      name: dto.name?.trim() || dto.business_name.trim(),
      legal_name: dto.legal_name.trim(),
      identification_type: dto.identification_type ?? IdentificationType.LEGAL,
      identification_number:
        dto.identification_number?.trim() ?? dto.cedula_juridica.trim(),
      cedula_juridica: dto.cedula_juridica.trim(),
      branch_number: dto.branch_number.trim(),
      address: dto.address.trim(),
      province: dto.province.trim(),
      canton: dto.canton.trim(),
      district: dto.district.trim(),
      city: dto.city?.trim() ?? null,
      phone: dto.phone?.trim() ?? null,
      email: dto.email?.trim() ?? null,
      activity_code: dto.activity_code?.trim() ?? null,
      provider_code: dto.provider_code?.trim() ?? null,
      cert_path: dto.cert_path?.trim() ?? null,
      crypto_key_encrypted: this.encryption_service.encrypt(dto.crypto_key),
      hacienda_username: dto.hacienda_username?.trim() ?? null,
      hacienda_password_encrypted: this.encryption_service.encrypt(
        dto.hacienda_password,
      ),
      mail_key_encrypted: this.encryption_service.encrypt(dto.mail_key),
      signature_type: dto.signature_type?.trim() ?? null,
      is_active: dto.is_active ?? true,
    });

    return this.serialize_branch(await this.branches_repository.save(branch));
  }

  async get_branch(current_user: AuthenticatedUserContext, branch_id: number) {
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
    return this.serialize_branch(branch);
  }

  async update_branch(
    current_user: AuthenticatedUserContext,
    branch_id: number,
    dto: UpdateBranchDto,
  ) {
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
    this.assert_branch_configuration_permissions(current_user, dto);

    if (dto.code) {
      this.entity_code_service.validate_code('BR', dto.code);
      branch.code = dto.code;
    }

    if (dto.business_name) {
      branch.business_name = dto.business_name.trim();
    }
    if (dto.name) {
      branch.name = dto.name.trim();
    }
    if (dto.legal_name) {
      branch.legal_name = dto.legal_name.trim();
    }
    if (dto.identification_type !== undefined) {
      branch.identification_type = dto.identification_type;
    }
    if (dto.identification_number !== undefined) {
      branch.identification_number = dto.identification_number.trim();
    }
    if (dto.cedula_juridica) {
      branch.cedula_juridica = dto.cedula_juridica.trim();
    }
    if (dto.branch_number) {
      branch.branch_number = dto.branch_number.trim();
    }
    if (dto.address) {
      branch.address = dto.address.trim();
    }
    if (dto.province) {
      branch.province = dto.province.trim();
    }
    if (dto.canton) {
      branch.canton = dto.canton.trim();
    }
    if (dto.district) {
      branch.district = dto.district.trim();
    }
    if (dto.city !== undefined) {
      branch.city = dto.city?.trim() || null;
    }
    if (dto.phone !== undefined) {
      branch.phone = dto.phone?.trim() || null;
    }
    if (dto.email !== undefined) {
      branch.email = dto.email?.trim() || null;
    }
    if (dto.activity_code !== undefined) {
      branch.activity_code = dto.activity_code?.trim() || null;
    }
    if (dto.provider_code !== undefined) {
      branch.provider_code = dto.provider_code?.trim() || null;
    }
    if (dto.cert_path !== undefined) {
      branch.cert_path = dto.cert_path?.trim() || null;
    }
    if (dto.crypto_key !== undefined) {
      branch.crypto_key_encrypted = this.encryption_service.encrypt(
        dto.crypto_key,
      );
    }
    if (dto.hacienda_username !== undefined) {
      branch.hacienda_username = dto.hacienda_username?.trim() || null;
    }
    if (dto.hacienda_password !== undefined) {
      branch.hacienda_password_encrypted = this.encryption_service.encrypt(
        dto.hacienda_password,
      );
    }
    if (dto.mail_key !== undefined) {
      branch.mail_key_encrypted = this.encryption_service.encrypt(dto.mail_key);
    }
    if (dto.signature_type !== undefined) {
      branch.signature_type = dto.signature_type?.trim() || null;
    }
    if (dto.is_active !== undefined) {
      branch.is_active = dto.is_active;
    }

    return this.serialize_branch(await this.branches_repository.save(branch));
  }

  async delete_branch(
    current_user: AuthenticatedUserContext,
    branch_id: number,
  ): Promise<{ id: number; deleted: true }> {
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

    if (
      warehouses > 0 ||
      warehouse_locations > 0 ||
      warehouse_stock > 0 ||
      warehouse_branch_links > 0 ||
      inventory_lots > 0 ||
      inventory_movement_headers > 0 ||
      inventory_movements > 0
    ) {
      throw new DomainBadRequestException({
        code: 'BRANCH_DELETE_FORBIDDEN',
        messageKey: 'branches.delete_forbidden',
        details: {
          branch_id,
          dependencies: {
            warehouses,
            warehouse_locations,
            warehouse_stock,
            warehouse_branch_links,
            inventory_lots,
            inventory_movement_headers,
            inventory_movements,
          },
        },
      });
    }

    await this.branches_repository.remove(branch);
    return {
      id: branch_id,
      deleted: true,
    };
  }

  async create_terminal(
    current_user: AuthenticatedUserContext,
    branch_id: number,
    dto: CreateTerminalDto,
  ) {
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
    if (dto.code) {
      this.entity_code_service.validate_code('TR', dto.code);
    }

    const terminal = this.terminals_repository.create({
      branch_id: branch.id,
      code: dto.code ?? null,
      terminal_number: dto.terminal_number.trim(),
      name: dto.name.trim(),
      is_active: dto.is_active ?? true,
    });

    return this.serialize_terminal(
      await this.terminals_repository.save(terminal),
    );
  }

  async update_terminal(
    current_user: AuthenticatedUserContext,
    terminal_id: number,
    dto: UpdateTerminalDto,
  ) {
    const terminal =
      await this.terminals_repository.find_by_id_with_branch(terminal_id);
    if (!terminal || !terminal.branch) {
      throw new DomainNotFoundException({
        code: 'TERMINAL_NOT_FOUND',
        messageKey: 'terminals.not_found',
        details: {
          terminal_id,
        },
      });
    }

    if (
      terminal.branch.business_id !==
      resolve_effective_business_id(current_user)
    ) {
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

    if (dto.code) {
      this.entity_code_service.validate_code('TR', dto.code);
      terminal.code = dto.code;
    }
    if (dto.terminal_number) {
      terminal.terminal_number = dto.terminal_number.trim();
    }
    if (dto.name) {
      terminal.name = dto.name.trim();
    }
    if (dto.is_active !== undefined) {
      terminal.is_active = dto.is_active;
    }

    return this.serialize_terminal(
      await this.terminals_repository.save(terminal),
    );
  }

  async delete_terminal(
    current_user: AuthenticatedUserContext,
    terminal_id: number,
  ): Promise<{ id: number; deleted: true }> {
    const terminal =
      await this.terminals_repository.find_by_id_with_branch(terminal_id);
    if (!terminal || !terminal.branch) {
      throw new DomainNotFoundException({
        code: 'TERMINAL_NOT_FOUND',
        messageKey: 'terminals.not_found',
        details: {
          terminal_id,
        },
      });
    }

    if (
      terminal.branch.business_id !==
      resolve_effective_business_id(current_user)
    ) {
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

    await this.terminals_repository.remove(terminal);
    return {
      id: terminal_id,
      deleted: true,
    };
  }

  private assert_branch_configuration_permissions(
    current_user: AuthenticatedUserContext,
    dto: Partial<CreateBranchDto | UpdateBranchDto>,
  ): void {
    const touches_sensitive_configuration = [
      dto.activity_code,
      dto.provider_code,
      dto.cert_path,
      dto.crypto_key,
      dto.hacienda_username,
      dto.hacienda_password,
      dto.mail_key,
      dto.signature_type,
    ].some((value) => value !== undefined);

    if (
      touches_sensitive_configuration &&
      !current_user.permissions.includes('branches.configure')
    ) {
      throw new DomainForbiddenException({
        code: 'BRANCH_CONFIGURATION_PERMISSION_REQUIRED',
        messageKey: 'branches.configuration_permission_required',
      });
    }
  }

  private serialize_branch(branch: Branch) {
    return serialize_branch(branch);
  }

  private serialize_terminal(terminal: Terminal) {
    return serialize_terminal(terminal);
  }
}
