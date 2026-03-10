import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { EntityCodeService } from '../../common/services/entity-code.service';
import { CreateWarrantyProfileDto } from '../dto/create-warranty-profile.dto';
import { UpdateWarrantyProfileDto } from '../dto/update-warranty-profile.dto';
import { WarrantyProfile } from '../entities/warranty-profile.entity';
import { WarrantyProfilesRepository } from '../repositories/warranty-profiles.repository';

@Injectable()
export class WarrantyProfilesService {
  constructor(
    private readonly warranty_profiles_repository: WarrantyProfilesRepository,
    private readonly entity_code_service: EntityCodeService,
  ) {}

  async get_warranty_profiles(current_user: AuthenticatedUserContext) {
    const warranty_profiles =
      await this.warranty_profiles_repository.find_all_by_business(
        current_user.business_id,
      );
    return warranty_profiles.map((warranty_profile) =>
      this.serialize_warranty_profile(warranty_profile),
    );
  }

  async create_warranty_profile(
    current_user: AuthenticatedUserContext,
    dto: CreateWarrantyProfileDto,
  ) {
    if (
      await this.warranty_profiles_repository.exists_name_in_business(
        current_user.business_id,
        dto.name.trim(),
      )
    ) {
      throw new ConflictException(
        'A warranty profile with this name already exists.',
      );
    }

    if (dto.code) {
      this.entity_code_service.validate_code('WP', dto.code);
    }

    return this.serialize_warranty_profile(
      await this.warranty_profiles_repository.save(
        this.warranty_profiles_repository.create({
          business_id: current_user.business_id,
          code: dto.code?.trim() ?? null,
          name: dto.name.trim(),
          duration_value: dto.duration_value,
          duration_unit: dto.duration_unit,
          coverage_notes: this.normalize_optional_string(dto.coverage_notes),
          is_active: dto.is_active ?? true,
        }),
      ),
    );
  }

  async get_warranty_profile(
    current_user: AuthenticatedUserContext,
    warranty_profile_id: number,
  ) {
    return this.serialize_warranty_profile(
      await this.get_warranty_profile_entity(
        current_user.business_id,
        warranty_profile_id,
      ),
    );
  }

  async update_warranty_profile(
    current_user: AuthenticatedUserContext,
    warranty_profile_id: number,
    dto: UpdateWarrantyProfileDto,
  ) {
    const warranty_profile = await this.get_warranty_profile_entity(
      current_user.business_id,
      warranty_profile_id,
    );

    const next_name = dto.name?.trim() ?? warranty_profile.name;
    if (
      await this.warranty_profiles_repository.exists_name_in_business(
        current_user.business_id,
        next_name,
        warranty_profile.id,
      )
    ) {
      throw new ConflictException(
        'A warranty profile with this name already exists.',
      );
    }

    if (dto.code) {
      this.entity_code_service.validate_code('WP', dto.code.trim());
      warranty_profile.code = dto.code.trim();
    }
    if (dto.name) {
      warranty_profile.name = dto.name.trim();
    }
    if (dto.duration_value !== undefined) {
      warranty_profile.duration_value = dto.duration_value;
    }
    if (dto.duration_unit) {
      warranty_profile.duration_unit = dto.duration_unit;
    }
    if (dto.coverage_notes !== undefined) {
      warranty_profile.coverage_notes = this.normalize_optional_string(
        dto.coverage_notes,
      );
    }
    if (dto.is_active !== undefined) {
      warranty_profile.is_active = dto.is_active;
    }

    return this.serialize_warranty_profile(
      await this.warranty_profiles_repository.save(warranty_profile),
    );
  }

  private async get_warranty_profile_entity(
    business_id: number,
    warranty_profile_id: number,
  ): Promise<WarrantyProfile> {
    const warranty_profile =
      await this.warranty_profiles_repository.find_by_id_in_business(
        warranty_profile_id,
        business_id,
      );
    if (!warranty_profile) {
      throw new NotFoundException('Warranty profile not found.');
    }

    return warranty_profile;
  }

  private normalize_optional_string(value?: string | null): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }

  private serialize_warranty_profile(warranty_profile: WarrantyProfile) {
    return {
      id: warranty_profile.id,
      code: warranty_profile.code,
      business_id: warranty_profile.business_id,
      name: warranty_profile.name,
      duration_value: warranty_profile.duration_value,
      duration_unit: warranty_profile.duration_unit,
      coverage_notes: warranty_profile.coverage_notes,
      is_active: warranty_profile.is_active,
      created_at: warranty_profile.created_at,
      updated_at: warranty_profile.updated_at,
    };
  }
}
