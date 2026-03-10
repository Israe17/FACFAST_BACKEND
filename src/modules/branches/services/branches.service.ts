import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { EntityCodeService } from '../../common/services/entity-code.service';
import { EncryptionService } from '../../common/services/encryption.service';
import { CreateBranchDto } from '../dto/create-branch.dto';
import { CreateTerminalDto } from '../dto/create-terminal.dto';
import { UpdateBranchDto } from '../dto/update-branch.dto';
import { UpdateTerminalDto } from '../dto/update-terminal.dto';
import { Branch } from '../entities/branch.entity';
import { Terminal } from '../entities/terminal.entity';
import { BranchAccessPolicy } from '../policies/branch-access.policy';
import { BranchesRepository } from '../repositories/branches.repository';
import { TerminalsRepository } from '../repositories/terminals.repository';

@Injectable()
export class BranchesService {
  constructor(
    private readonly branches_repository: BranchesRepository,
    private readonly terminals_repository: TerminalsRepository,
    private readonly branch_access_policy: BranchAccessPolicy,
    private readonly entity_code_service: EntityCodeService,
    private readonly encryption_service: EncryptionService,
  ) {}

  async get_branches(current_user: AuthenticatedUserContext) {
    const branch_ids = this.branch_access_policy.is_owner(current_user)
      ? undefined
      : current_user.branch_ids;

    const branches = await this.branches_repository.find_all_by_business(
      current_user.business_id,
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
      business_id: current_user.business_id,
      code: dto.code ?? null,
      business_name: dto.business_name.trim(),
      legal_name: dto.legal_name.trim(),
      cedula_juridica: dto.cedula_juridica.trim(),
      branch_number: dto.branch_number.trim(),
      address: dto.address.trim(),
      province: dto.province.trim(),
      canton: dto.canton.trim(),
      district: dto.district.trim(),
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
      current_user.business_id,
    );
    if (!branch) {
      throw new NotFoundException('Branch not found.');
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
      current_user.business_id,
    );
    if (!branch) {
      throw new NotFoundException('Branch not found.');
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
    if (dto.legal_name) {
      branch.legal_name = dto.legal_name.trim();
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

  async create_terminal(
    current_user: AuthenticatedUserContext,
    branch_id: number,
    dto: CreateTerminalDto,
  ) {
    const branch = await this.branches_repository.find_by_id_in_business(
      branch_id,
      current_user.business_id,
    );
    if (!branch) {
      throw new NotFoundException('Branch not found.');
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
      throw new NotFoundException('Terminal not found.');
    }

    if (terminal.branch.business_id !== current_user.business_id) {
      throw new NotFoundException('Terminal not found.');
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
      throw new ForbiddenException(
        'branches.configure permission is required for sensitive branch configuration.',
      );
    }
  }

  private serialize_branch(branch: Branch) {
    return {
      id: branch.id,
      code: branch.code,
      business_id: branch.business_id,
      business_name: branch.business_name,
      legal_name: branch.legal_name,
      cedula_juridica: branch.cedula_juridica,
      branch_number: branch.branch_number,
      address: branch.address,
      province: branch.province,
      canton: branch.canton,
      district: branch.district,
      phone: branch.phone,
      email: branch.email,
      activity_code: branch.activity_code,
      provider_code: branch.provider_code,
      cert_path: branch.cert_path,
      hacienda_username: branch.hacienda_username,
      signature_type: branch.signature_type,
      is_active: branch.is_active,
      has_crypto_key: Boolean(branch.crypto_key_encrypted),
      has_hacienda_password: Boolean(branch.hacienda_password_encrypted),
      has_mail_key: Boolean(branch.mail_key_encrypted),
      created_at: branch.created_at,
      updated_at: branch.updated_at,
      terminals:
        branch.terminals?.map((terminal) =>
          this.serialize_terminal(terminal),
        ) ?? [],
    };
  }

  private serialize_terminal(terminal: Terminal) {
    return {
      id: terminal.id,
      code: terminal.code,
      branch_id: terminal.branch_id,
      terminal_number: terminal.terminal_number,
      name: terminal.name,
      is_active: terminal.is_active,
      created_at: terminal.created_at,
      updated_at: terminal.updated_at,
    };
  }
}
