import { Injectable } from '@nestjs/common';
import { CommandUseCase } from '../../common/application/interfaces/command-use-case.interface';
import { IdentificationType } from '../../common/enums/identification-type.enum';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { EntityCodeService } from '../../common/services/entity-code.service';
import { EncryptionService } from '../../common/services/encryption.service';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { BranchView } from '../contracts/branch.view';
import { CreateBranchDto } from '../dto/create-branch.dto';
import { BranchLifecyclePolicy } from '../policies/branch-lifecycle.policy';
import { BranchesRepository } from '../repositories/branches.repository';
import { BranchSerializer } from '../serializers/branch.serializer';
import { BranchesValidationService } from '../services/branches-validation.service';

export type CreateBranchCommand = {
  current_user: AuthenticatedUserContext;
  dto: CreateBranchDto;
};

@Injectable()
export class CreateBranchUseCase
  implements CommandUseCase<CreateBranchCommand, BranchView>
{
  constructor(
    private readonly branches_repository: BranchesRepository,
    private readonly branches_validation_service: BranchesValidationService,
    private readonly branch_lifecycle_policy: BranchLifecyclePolicy,
    private readonly entity_code_service: EntityCodeService,
    private readonly encryption_service: EncryptionService,
    private readonly branch_serializer: BranchSerializer,
  ) {}

  async execute({
    current_user,
    dto,
  }: CreateBranchCommand): Promise<BranchView> {
    this.branches_validation_service.assert_configuration_permissions(
      current_user,
      dto,
    );

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
      latitude: dto.latitude ?? null,
      longitude: dto.longitude ?? null,
    });

    const saved_branch = await this.branches_repository.save(branch);
    return this.branch_serializer.serialize(
      saved_branch,
      this.branch_lifecycle_policy.build_lifecycle(saved_branch, {
        warehouses: 0,
        warehouse_locations: 0,
        warehouse_stock: 0,
        warehouse_branch_links: 0,
        inventory_lots: 0,
        inventory_movement_headers: 0,
        inventory_movements: 0,
      }),
    );
  }
}
