import { Injectable } from '@nestjs/common';
import { CommandUseCase } from '../../common/application/interfaces/command-use-case.interface';
import { DomainConflictException } from '../../common/errors/exceptions/domain-conflict.exception';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { EntityCodeService } from '../../common/services/entity-code.service';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { WarehouseView } from '../contracts/warehouse.view';
import { CreateWarehouseDto } from '../dto/create-warehouse.dto';
import { Warehouse } from '../entities/warehouse.entity';
import { InventoryValidationService } from '../services/inventory-validation.service';
import { WarehouseBranchLinksRepository } from '../repositories/warehouse-branch-links.repository';
import { WarehousesRepository } from '../repositories/warehouses.repository';
import { WarehouseSerializer } from '../serializers/warehouse.serializer';

export type CreateWarehouseCommand = {
  current_user: AuthenticatedUserContext;
  dto: CreateWarehouseDto;
};

@Injectable()
export class CreateWarehouseUseCase
  implements CommandUseCase<CreateWarehouseCommand, WarehouseView>
{
  constructor(
    private readonly warehouses_repository: WarehousesRepository,
    private readonly warehouse_branch_links_repository: WarehouseBranchLinksRepository,
    private readonly inventory_validation_service: InventoryValidationService,
    private readonly entity_code_service: EntityCodeService,
    private readonly warehouse_serializer: WarehouseSerializer,
  ) {}

  async execute({
    current_user,
    dto,
  }: CreateWarehouseCommand): Promise<WarehouseView> {
    const business_id = resolve_effective_business_id(current_user);
    const branch =
      await this.inventory_validation_service.get_branch_for_operation(
        current_user,
        dto.branch_id,
      );

    if (
      await this.warehouses_repository.exists_name_in_branch(
        branch.id,
        dto.name.trim(),
      )
    ) {
      throw new DomainConflictException({
        code: 'WAREHOUSE_NAME_DUPLICATE',
        messageKey: 'inventory.warehouse_name_duplicate',
        details: {
          field: 'name',
          branch_id: branch.id,
        },
      });
    }

    if (dto.code) {
      this.entity_code_service.validate_code('WH', dto.code);
    }

    if (dto.is_default) {
      await this.warehouses_repository.unset_default_for_branch(branch.id);
    }

    const saved_warehouse = await this.warehouses_repository.save(
      this.warehouses_repository.create({
        business_id,
        branch_id: branch.id,
        code: dto.code?.trim() ?? null,
        name: dto.name.trim(),
        description: this.normalize_optional_string(dto.description),
        purpose: dto.purpose,
        uses_locations: dto.uses_locations ?? false,
        is_default: dto.is_default ?? false,
        is_active: dto.is_active ?? true,
        latitude: dto.latitude ?? null,
        longitude: dto.longitude ?? null,
      }),
    );
    await this.sync_primary_branch_link(saved_warehouse, branch.id);
    const persisted_warehouse = await this.warehouses_repository.find_by_id_in_business(
      saved_warehouse.id,
      business_id,
    );
    return this.warehouse_serializer.serialize(persisted_warehouse!);
  }

  private async sync_primary_branch_link(
    warehouse: Warehouse,
    branch_id: number,
  ): Promise<void> {
    const existing_link =
      await this.warehouse_branch_links_repository.find_by_warehouse_and_branch(
        warehouse.business_id,
        warehouse.id,
        branch_id,
      );

    if (existing_link) {
      existing_link.is_active = true;
      existing_link.is_primary_for_sales = warehouse.is_default;
      existing_link.is_primary_for_purchases = warehouse.is_default;
      existing_link.priority = warehouse.is_default ? 1 : 100;
      await this.warehouse_branch_links_repository.save(existing_link);
    } else {
      await this.warehouse_branch_links_repository.save(
        this.warehouse_branch_links_repository.create({
          business_id: warehouse.business_id,
          warehouse_id: warehouse.id,
          branch_id,
          is_primary_for_sales: warehouse.is_default,
          is_primary_for_purchases: warehouse.is_default,
          priority: warehouse.is_default ? 1 : 100,
          is_active: true,
        }),
      );
    }

    await this.warehouse_branch_links_repository.deactivate_other_links(
      warehouse.business_id,
      warehouse.id,
      branch_id,
    );
  }

  private normalize_optional_string(value?: string | null): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }
}
