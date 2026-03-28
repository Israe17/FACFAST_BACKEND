import { Injectable } from '@nestjs/common';
import { DomainBadRequestException } from '../../common/errors/exceptions/domain-bad-request.exception';
import { DomainConflictException } from '../../common/errors/exceptions/domain-conflict.exception';
import { DomainNotFoundException } from '../../common/errors/exceptions/domain-not-found.exception';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { EntityCodeService } from '../../common/services/entity-code.service';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { CreateBrandDto } from '../dto/create-brand.dto';
import { UpdateBrandDto } from '../dto/update-brand.dto';
import { Brand } from '../entities/brand.entity';
import { BrandsRepository } from '../repositories/brands.repository';
import { ProductsRepository } from '../repositories/products.repository';

@Injectable()
export class BrandsService {
  constructor(
    private readonly brands_repository: BrandsRepository,
    private readonly entity_code_service: EntityCodeService,
    private readonly products_repository: ProductsRepository,
  ) {}

  async get_brands(current_user: AuthenticatedUserContext) {
    const business_id = resolve_effective_business_id(current_user);
    const brands =
      await this.brands_repository.find_all_by_business(business_id);
    return brands.map((brand) => this.serialize_brand(brand));
  }

  async create_brand(
    current_user: AuthenticatedUserContext,
    dto: CreateBrandDto,
  ) {
    const business_id = resolve_effective_business_id(current_user);
    if (
      await this.brands_repository.exists_name_in_business(
        business_id,
        dto.name.trim(),
      )
    ) {
      throw new DomainConflictException({
        code: 'BRAND_NAME_DUPLICATE',
        messageKey: 'inventory.brand_name_duplicate',
        details: {
          field: 'name',
        },
      });
    }

    if (dto.code) {
      this.entity_code_service.validate_code('MK', dto.code);
    }

    return this.serialize_brand(
      await this.brands_repository.save(
        this.brands_repository.create({
          business_id,
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
      await this.get_brand_entity(
        resolve_effective_business_id(current_user),
        brand_id,
      ),
    );
  }

  async update_brand(
    current_user: AuthenticatedUserContext,
    brand_id: number,
    dto: UpdateBrandDto,
  ) {
    const business_id = resolve_effective_business_id(current_user);
    const brand = await this.get_brand_entity(business_id, brand_id);
    const next_name = dto.name?.trim() ?? brand.name;

    if (
      await this.brands_repository.exists_name_in_business(
        business_id,
        next_name,
        brand.id,
      )
    ) {
      throw new DomainConflictException({
        code: 'BRAND_NAME_DUPLICATE',
        messageKey: 'inventory.brand_name_duplicate',
        details: {
          field: 'name',
        },
      });
    }

    if (dto.code !== undefined) {
      if (dto.code !== null) {
        this.entity_code_service.validate_code('MK', dto.code.trim());
      }
      brand.code = dto.code?.trim() ?? null;
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

  async delete_brand(current_user: AuthenticatedUserContext, brand_id: number) {
    const business_id = resolve_effective_business_id(current_user);
    const brand = await this.get_brand_entity(business_id, brand_id);

    const product_count =
      await this.products_repository.count_by_brand_in_business(
        business_id,
        brand_id,
      );
    if (product_count > 0) {
      throw new DomainBadRequestException({
        code: 'BRAND_IN_USE',
        messageKey: 'inventory.brand_in_use',
        details: { brand_id, product_count },
      });
    }

    await this.brands_repository.remove(brand);
    return { id: brand_id };
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
      throw new DomainNotFoundException({
        code: 'BRAND_NOT_FOUND',
        messageKey: 'inventory.brand_not_found',
        details: {
          brand_id,
        },
      });
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
      lifecycle: {
        can_delete: true,
        can_deactivate: brand.is_active,
        can_reactivate: !brand.is_active,
        reasons: [],
      },
      created_at: brand.created_at,
      updated_at: brand.updated_at,
    };
  }
}
