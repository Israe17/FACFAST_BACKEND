import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Branch } from '../../branches/entities/branch.entity';
import { Terminal } from '../../branches/entities/terminal.entity';
import { Business } from '../../common/entities/business.entity';
import { BaseCodeEntity } from '../../common/entities/base-code.entity';
import { DomainConflictException } from '../../common/errors/exceptions/domain-conflict.exception';
import { DomainInternalServerException } from '../../common/errors/exceptions/domain-internal-server.exception';
import { UserStatus } from '../../common/enums/user-status.enum';
import { UserType } from '../../common/enums/user-type.enum';
import { EntityCodeService } from '../../common/services/entity-code.service';
import { PasswordHashService } from '../../common/services/password-hash.service';
import { Role } from '../../rbac/entities/role.entity';
import { RbacSeedService } from '../../rbac/services/rbac-seed.service';
import { UserBranchAccess } from '../../users/entities/user-branch-access.entity';
import { UserRole } from '../../users/entities/user-role.entity';
import { User } from '../../users/entities/user.entity';
import { CreateBusinessOnboardingDto } from '../dto/create-business-onboarding.dto';
import {
  serialize_branch,
  serialize_terminal,
} from '../../branches/utils/serialize-branch.util';
import { serialize_business } from '../utils/serialize-business.util';

@Injectable()
export class BusinessOnboardingService {
  constructor(
    private readonly data_source: DataSource,
    private readonly password_hash_service: PasswordHashService,
    private readonly entity_code_service: EntityCodeService,
    private readonly rbac_seed_service: RbacSeedService,
  ) {}

  async onboard_business(dto: CreateBusinessOnboardingDto) {
    return this.data_source.transaction(async (manager) => {
      await this.rbac_seed_service.seed_base_permissions_in_manager(manager);

      const business_repository = manager.getRepository(Business);
      const user_repository = manager.getRepository(User);
      const role_repository = manager.getRepository(Role);
      const user_role_repository = manager.getRepository(UserRole);
      const user_branch_access_repository =
        manager.getRepository(UserBranchAccess);
      const branch_repository = manager.getRepository(Branch);
      const terminal_repository = manager.getRepository(Terminal);

      const business_identification_number = this.normalize_required_string(
        dto.business.identification_number,
      );
      const owner_email = this.normalize_email(dto.owner.owner_email);

      const existing_business = await business_repository.findOne({
        where: {
          identification_type: dto.business.identification_type,
          identification_number: business_identification_number,
        },
      });
      if (existing_business) {
        throw new DomainConflictException({
          code: 'BUSINESS_IDENTIFICATION_DUPLICATE',
          messageKey: 'businesses.identification_duplicate',
          details: {
            field: 'business.identification_number',
          },
        });
      }

      const existing_user = await user_repository.findOne({
        where: {
          email: owner_email,
        },
      });
      if (existing_user) {
        throw new DomainConflictException({
          code: 'BUSINESS_OWNER_EMAIL_DUPLICATE',
          messageKey: 'businesses.owner_email_duplicate',
          details: {
            field: 'owner.owner_email',
          },
        });
      }

      const business = await this.save_with_code(
        business_repository,
        business_repository.create({
          code: null,
          name: this.normalize_required_string(dto.business.name),
          legal_name: this.normalize_required_string(dto.business.legal_name),
          identification_type: dto.business.identification_type,
          identification_number: business_identification_number,
          currency_code: dto.business.currency_code.trim().toUpperCase(),
          timezone: this.normalize_required_string(dto.business.timezone),
          language: this.normalize_required_string(dto.business.language),
          email: this.normalize_optional_email(dto.business.email),
          phone: this.normalize_optional_string(dto.business.phone),
          website: this.normalize_optional_string(dto.business.website),
          logo_url: this.normalize_optional_string(dto.business.logo_url),
          country: this.normalize_required_string(dto.business.country),
          province: this.normalize_required_string(dto.business.province),
          canton: this.normalize_required_string(dto.business.canton),
          district: this.normalize_required_string(dto.business.district),
          city: this.normalize_optional_string(dto.business.city),
          address: this.normalize_required_string(dto.business.address),
          postal_code: this.normalize_optional_string(dto.business.postal_code),
          is_active: dto.business.is_active ?? true,
        }),
        'BS',
      );

      await this.rbac_seed_service.ensure_suggested_roles_for_business_in_manager(
        business.id,
        manager,
      );

      const owner_role = await role_repository.findOne({
        where: {
          business_id: business.id,
          role_key: 'owner',
        },
      });
      if (!owner_role) {
        throw new DomainInternalServerException({
          code: 'BUSINESS_OWNER_ROLE_RESOLUTION_FAILED',
          messageKey: 'businesses.owner_role_resolution_failed',
          details: {
            business_id: business.id,
            role_key: 'owner',
          },
        });
      }

      const owner = await this.save_with_code(
        user_repository,
        user_repository.create({
          business_id: business.id,
          code: null,
          name: this.build_owner_full_name(
            dto.owner.owner_name,
            dto.owner.owner_last_name,
          ),
          email: owner_email,
          password_hash: await this.password_hash_service.hash(
            dto.owner.owner_password,
          ),
          status: UserStatus.ACTIVE,
          allow_login: true,
          user_type: UserType.OWNER,
          max_sale_discount: 100,
          last_login_at: null,
        }),
        'US',
      );

      await user_role_repository.save(
        user_role_repository.create({
          user_id: owner.id,
          role_id: owner_role.id,
        }),
      );

      const branch_name = this.normalize_required_string(
        dto.initial_branch.branch_name,
      );
      const branch = await this.save_with_code(
        branch_repository,
        branch_repository.create({
          business_id: business.id,
          code: null,
          business_name: this.build_branch_business_name(
            business.name,
            branch_name,
          ),
          name: branch_name,
          legal_name: business.legal_name,
          identification_type: dto.initial_branch.branch_identification_type,
          identification_number: this.normalize_required_string(
            dto.initial_branch.branch_identification_number,
          ),
          cedula_juridica: this.normalize_required_string(
            dto.initial_branch.branch_identification_number,
          ),
          branch_number: dto.initial_branch.branch_number.trim(),
          address: this.normalize_required_string(
            dto.initial_branch.branch_address,
          ),
          province: this.normalize_required_string(
            dto.initial_branch.branch_province,
          ),
          canton: this.normalize_required_string(
            dto.initial_branch.branch_canton,
          ),
          district: this.normalize_required_string(
            dto.initial_branch.branch_district,
          ),
          city: this.normalize_optional_string(dto.initial_branch.branch_city),
          phone: this.normalize_optional_string(
            dto.initial_branch.branch_phone,
          ),
          email: this.normalize_optional_email(dto.initial_branch.branch_email),
          activity_code: this.normalize_optional_string(
            dto.initial_branch.activity_code,
          ),
          provider_code: this.normalize_optional_string(
            dto.initial_branch.provider_code,
          ),
          cert_path: null,
          crypto_key_encrypted: null,
          hacienda_username: null,
          hacienda_password_encrypted: null,
          mail_key_encrypted: null,
          signature_type: null,
          is_active: dto.initial_branch.is_active ?? true,
        }),
        'BR',
      );

      await user_branch_access_repository.save(
        user_branch_access_repository.create({
          user_id: owner.id,
          branch_id: branch.id,
        }),
      );

      let terminal: Terminal | null = null;
      if (dto.initial_terminal?.create_initial_terminal) {
        terminal = await this.save_with_code(
          terminal_repository,
          terminal_repository.create({
            branch_id: branch.id,
            code: null,
            terminal_number: dto.initial_terminal.terminal_number!.trim(),
            name: dto.initial_terminal.terminal_name!.trim(),
            is_active: true,
          }),
          'TR',
        );
      }

      return {
        business: serialize_business(business),
        owner: this.serialize_owner(owner, owner_role),
        initial_branch: serialize_branch(branch),
        initial_terminal: terminal ? serialize_terminal(terminal) : null,
        onboarding_ready: true,
      };
    });
  }

  private async save_with_code<T extends BaseCodeEntity>(
    repository: Repository<T>,
    entity: T,
    prefix: string,
  ): Promise<T> {
    const saved_entity = await repository.save(entity);
    return this.entity_code_service.ensure_code(
      repository,
      saved_entity,
      prefix,
    );
  }

  private build_owner_full_name(name: string, last_name: string): string {
    return `${this.normalize_required_string(name)} ${this.normalize_required_string(last_name)}`;
  }

  private build_branch_business_name(
    business_name: string,
    branch_name: string,
  ): string {
    if (
      business_name.trim().toLowerCase() === branch_name.trim().toLowerCase()
    ) {
      return business_name.trim();
    }

    return `${business_name.trim()} ${branch_name.trim()}`;
  }

  private normalize_email(value: string): string {
    return value.trim().toLowerCase();
  }

  private normalize_required_string(value: string): string {
    return value.trim();
  }

  private normalize_optional_email(value?: string | null): string | null {
    const normalized = value?.trim().toLowerCase();
    return normalized ? normalized : null;
  }

  private normalize_optional_string(value?: string | null): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }
  private serialize_owner(owner: User, owner_role: Role) {
    return {
      id: owner.id,
      code: owner.code,
      business_id: owner.business_id,
      name: owner.name,
      email: owner.email,
      status: owner.status,
      allow_login: owner.allow_login,
      user_type: owner.user_type,
      max_sale_discount: Number(owner.max_sale_discount ?? 0),
      role: {
        id: owner_role.id,
        code: owner_role.code,
        name: owner_role.name,
        role_key: owner_role.role_key,
      },
      created_at: owner.created_at,
      updated_at: owner.updated_at,
    };
  }
}
