import { Injectable } from '@nestjs/common';
import { CommandUseCase } from '../../common/application/interfaces/command-use-case.interface';
import { DomainConflictException } from '../../common/errors/exceptions/domain-conflict.exception';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { EntityCodeService } from '../../common/services/entity-code.service';
import { WarehouseView } from '../contracts/warehouse.view';
import { UpdateWarehouseDto } from '../dto/update-warehouse.dto';
import { Warehouse } from '../entities/warehouse.entity';
import { InventoryValidationService } from '../services/inventory-validation.service';
import { WarehouseBranchLinksRepository } from '../repositories/warehouse-branch-links.repository';
import { WarehousesRepository } from '../repositories/warehouses.repository';
import { WarehouseSerializer } from '../serializers/warehouse.serializer';

export type UpdateWarehouseCommand = {
  current_user: AuthenticatedUserContext;
  warehouse_id: number;
  dto: UpdateWarehouseDto;
};

@Injectable()
export class UpdateWarehouseUseCase
  implements CommandUseCase<UpdateWarehouseCommand, WarehouseView>
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
    warehouse_id,
    dto,
  }: UpdateWarehouseCommand): Promise<WarehouseView> {
    const warehouse =
      await this.inventory_validation_service.get_warehouse_for_operation(
        current_user,
        warehouse_id,
      );
    const branch =
      dto.branch_id !== undefined
        ? await this.inventory_validation_service.get_branch_for_operation(
            current_user,
            dto.branch_id,
          )
        : null;

    const next_branch_id = branch?.id ?? warehouse.branch_id;
    const next_name = dto.name?.trim() ?? warehouse.name;
    if (
      await this.warehouses_repository.exists_name_in_branch(
        next_branch_id,
        next_name,
        warehouse.id,
      )
    ) {
      throw new DomainConflictException({
        code: 'WAREHOUSE_NAME_DUPLICATE',
        messageKey: 'inventory.warehouse_name_duplicate',
        details: {
          field: 'name',
          branch_id: next_branch_id,
        },
      });
    }

    if (dto.code !== undefined) {
      if (dto.code !== null) {
        this.entity_code_service.validate_code('WH', dto.code.trim());
      }
      warehouse.code = dto.code?.trim() ?? null;
    }
    if (branch) {
      warehouse.branch_id = branch.id;
    }
    if (dto.name) {
      warehouse.name = dto.name.trim();
    }
    if (dto.description !== undefined) {
      warehouse.description = this.normalize_optional_string(dto.description);
    }
    if (dto.purpose !== undefined) {
      warehouse.purpose = dto.purpose;
    }
    if (dto.uses_locations !== undefined) {
      warehouse.uses_locations = dto.uses_locations;
    }
    if (dto.is_default !== undefined) {
      if (dto.is_default) {
        await this.warehouses_repository.unset_default_for_branch(
          warehouse.branch_id,
          warehouse.id,
        );
      }
      warehouse.is_default = dto.is_default;
    }
    if (dto.is_active !== undefined) {
      warehouse.is_active = dto.is_active;
    }

    const saved_warehouse = await this.warehouses_repository.save(warehouse);
    await this.sync_primary_branch_link(
      saved_warehouse,
      saved_warehouse.branch_id,
    );
    const persisted_warehouse = await this.warehouses_repository.find_by_id_in_business(
      saved_warehouse.id,
      saved_warehouse.business_id,
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
