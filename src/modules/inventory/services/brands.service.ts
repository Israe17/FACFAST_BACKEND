import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { EntityCodeService } from '../../common/services/entity-code.service';
import { CreateBrandDto } from '../dto/create-brand.dto';
import { UpdateBrandDto } from '../dto/update-brand.dto';
import { Brand } from '../entities/brand.entity';
import { BrandsRepository } from '../repositories/brands.repository';

@Injectable()
export class BrandsService {
  constructor(
    private readonly brands_repository: BrandsRepository,
    private readonly entity_code_service: EntityCodeService,
  ) {}

  async get_brands(current_user: AuthenticatedUserContext) {
    const brands = await this.brands_repository.find_all_by_business(
      current_user.business_id,
    );
    return brands.map((brand) => this.serialize_brand(brand));
  }

  async create_brand(
    current_user: AuthenticatedUserContext,
    dto: CreateBrandDto,
  ) {
    if (
      await this.brands_repository.exists_name_in_business(
        current_user.business_id,
        dto.name.trim(),
      )
    ) {
      throw new ConflictException('A brand with this name already exists.');
    }

    if (dto.code) {
      this.entity_code_service.validate_code('MK', dto.code);
    }

    return this.serialize_brand(
      await this.brands_repository.save(
        this.brands_repository.create({
          business_id: current_user.business_id,
          code: dto.code?.trim() ?? null,
          name: dto.name.trim(),
          description: this.normalize_optional_string(dto.description),
          is_active: dto.is_active ?? true,
        }),
      ),
    );
  }

  async get_brand(current_user: AuthenticatedUserContext, brand_id: number) {
    return this.serialize_brand(
      await this.get_brand_entity(current_user.business_id, brand_id),
    );
  }

  async update_brand(
    current_user: AuthenticatedUserContext,
    brand_id: number,
    dto: UpdateBrandDto,
  ) {
    const brand = await this.get_brand_entity(
      current_user.business_id,
      brand_id,
    );
    const next_name = dto.name?.trim() ?? brand.name;

    if (
      await this.brands_repository.exists_name_in_business(
        current_user.business_id,
        next_name,
        brand.id,
      )
    ) {
      throw new ConflictException('A brand with this name already exists.');
    }

    if (dto.code) {
      this.entity_code_service.validate_code('MK', dto.code.trim());
      brand.code = dto.code.trim();
    }
    if (dto.name) {
      brand.name = dto.name.trim();
    }
    if (dto.description !== undefined) {
      brand.description = this.normalize_optional_string(dto.description);
    }
    if (dto.is_active !== undefined) {
      brand.is_active = dto.is_active;
    }

    return this.serialize_brand(await this.brands_repository.save(brand));
  }

  private async get_brand_entity(
    business_id: number,
    brand_id: number,
  ): Promise<Brand> {
    const brand = await this.brands_repository.find_by_id_in_business(
      brand_id,
      business_id,
    );
    if (!brand) {
      throw new NotFoundException('Brand not found.');
    }

    return brand;
  }

  private normalize_optional_string(value?: string | null): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }

  private serialize_brand(brand: Brand) {
    return {
      id: brand.id,
      code: brand.code,
      business_id: brand.business_id,
      name: brand.name,
      description: brand.description,
      is_active: brand.is_active,
      created_at: brand.created_at,
      updated_at: brand.updated_at,
    };
  }
}
