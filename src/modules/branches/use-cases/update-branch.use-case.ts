import { Injectable } from '@nestjs/common';
import { CommandUseCase } from '../../common/application/interfaces/command-use-case.interface';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { EntityCodeService } from '../../common/services/entity-code.service';
import { EncryptionService } from '../../common/services/encryption.service';
import { BranchView } from '../contracts/branch.view';
import { UpdateBranchDto } from '../dto/update-branch.dto';
import { BranchLifecyclePolicy } from '../policies/branch-lifecycle.policy';
import { BranchesRepository } from '../repositories/branches.repository';
import { BranchSerializer } from '../serializers/branch.serializer';
import { BranchesValidationService } from '../services/branches-validation.service';

export type UpdateBranchCommand = {
  current_user: AuthenticatedUserContext;
  branch_id: number;
  dto: UpdateBranchDto;
};

@Injectable()
export class UpdateBranchUseCase
  implements CommandUseCase<UpdateBranchCommand, BranchView>
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
    branch_id,
    dto,
  }: UpdateBranchCommand): Promise<BranchView> {
    const branch = await this.branches_validation_service.get_branch_for_access(
      current_user,
      branch_id,
    );
    this.branches_validation_service.assert_configuration_permissions(
      current_user,
      dto,
    );

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

    const saved_branch = await this.branches_repository.save(branch);
    const dependencies =
      await this.branches_validation_service.count_branch_delete_dependencies(
        saved_branch,
      );
    return this.branch_serializer.serialize(
      saved_branch,
      this.branch_lifecycle_policy.build_lifecycle(saved_branch, dependencies),
    );
  }
}
