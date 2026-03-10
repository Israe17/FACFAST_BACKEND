import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { EntityCodeService } from '../../common/services/entity-code.service';
import { CreatePriceListDto } from '../dto/create-price-list.dto';
import { CreateProductPriceDto } from '../dto/create-product-price.dto';
import { UpdatePriceListDto } from '../dto/update-price-list.dto';
import { UpdateProductPriceDto } from '../dto/update-product-price.dto';
import { PriceList } from '../entities/price-list.entity';
import { ProductPrice } from '../entities/product-price.entity';
import { PriceListsRepository } from '../repositories/price-lists.repository';
import { ProductPricesRepository } from '../repositories/product-prices.repository';
import { InventoryValidationService } from './inventory-validation.service';

@Injectable()
export class PricingService {
  constructor(
    private readonly price_lists_repository: PriceListsRepository,
    private readonly product_prices_repository: ProductPricesRepository,
    private readonly inventory_validation_service: InventoryValidationService,
    private readonly entity_code_service: EntityCodeService,
  ) {}

  async get_price_lists(current_user: AuthenticatedUserContext) {
    const price_lists = await this.price_lists_repository.find_all_by_business(
      current_user.business_id,
    );
    return price_lists.map((price_list) =>
      this.serialize_price_list(price_list),
    );
  }

  async create_price_list(
    current_user: AuthenticatedUserContext,
    dto: CreatePriceListDto,
  ) {
    if (
      await this.price_lists_repository.exists_name_in_business(
        current_user.business_id,
        dto.name.trim(),
      )
    ) {
      throw new ConflictException(
        'A price list with this name already exists.',
      );
    }

    if (dto.code) {
      this.entity_code_service.validate_code('PL', dto.code);
    }

    if (dto.is_default) {
      await this.price_lists_repository.unset_default_for_business(
        current_user.business_id,
      );
    }

    return this.serialize_price_list(
      await this.price_lists_repository.save(
        this.price_lists_repository.create({
          business_id: current_user.business_id,
          code: dto.code?.trim() ?? null,
          name: dto.name.trim(),
          kind: dto.kind,
          currency: dto.currency.trim().toUpperCase(),
          is_default: dto.is_default ?? false,
          is_active: dto.is_active ?? true,
        }),
      ),
    );
  }

  async get_price_list(
    current_user: AuthenticatedUserContext,
    price_list_id: number,
  ) {
    return this.serialize_price_list(
      await this.get_price_list_entity(current_user.business_id, price_list_id),
    );
  }

  async update_price_list(
    current_user: AuthenticatedUserContext,
    price_list_id: number,
    dto: UpdatePriceListDto,
  ) {
    const price_list = await this.get_price_list_entity(
      current_user.business_id,
      price_list_id,
    );

    const next_name = dto.name?.trim() ?? price_list.name;
    if (
      await this.price_lists_repository.exists_name_in_business(
        current_user.business_id,
        next_name,
        price_list.id,
      )
    ) {
      throw new ConflictException(
        'A price list with this name already exists.',
      );
    }

    if (dto.code) {
      this.entity_code_service.validate_code('PL', dto.code.trim());
      price_list.code = dto.code.trim();
    }
    if (dto.name) {
      price_list.name = dto.name.trim();
    }
    if (dto.kind) {
      price_list.kind = dto.kind;
    }
    if (dto.currency) {
      price_list.currency = dto.currency.trim().toUpperCase();
    }
    if (dto.is_default !== undefined) {
      if (dto.is_default) {
        await this.price_lists_repository.unset_default_for_business(
          current_user.business_id,
          price_list.id,
        );
      }
      price_list.is_default = dto.is_default;
    }
    if (dto.is_active !== undefined) {
      price_list.is_active = dto.is_active;
    }

    return this.serialize_price_list(
      await this.price_lists_repository.save(price_list),
    );
  }

  async get_product_prices(
    current_user: AuthenticatedUserContext,
    product_id: number,
  ) {
    await this.inventory_validation_service.get_product_in_business(
      current_user.business_id,
      product_id,
    );

    const product_prices =
      await this.product_prices_repository.find_all_by_product_in_business(
        product_id,
        current_user.business_id,
      );
    return product_prices.map((product_price) =>
      this.serialize_product_price(product_price),
    );
  }

  async create_product_price(
    current_user: AuthenticatedUserContext,
    product_id: number,
    dto: CreateProductPriceDto,
  ) {
    const product =
      await this.inventory_validation_service.get_product_in_business(
        current_user.business_id,
        product_id,
      );
    const price_list =
      await this.inventory_validation_service.get_price_list_in_business(
        current_user.business_id,
        dto.price_list_id,
      );

    this.assert_valid_date_range(dto.valid_from, dto.valid_to);

    const saved_product_price = await this.product_prices_repository.save(
      this.product_prices_repository.create({
        business_id: current_user.business_id,
        product_id: product.id,
        price_list_id: price_list.id,
        price: dto.price,
        min_quantity: dto.min_quantity ?? null,
        valid_from: dto.valid_from ? new Date(dto.valid_from) : null,
        valid_to: dto.valid_to ? new Date(dto.valid_to) : null,
        is_active: dto.is_active ?? true,
      }),
    );

    const hydrated_product_price =
      await this.product_prices_repository.find_by_id_in_business(
        saved_product_price.id,
        current_user.business_id,
      );
    if (!hydrated_product_price) {
      throw new NotFoundException('Product price not found.');
    }

    return this.serialize_product_price(hydrated_product_price);
  }

  async update_product_price(
    current_user: AuthenticatedUserContext,
    product_price_id: number,
    dto: UpdateProductPriceDto,
  ) {
    const product_price =
      await this.product_prices_repository.find_by_id_in_business(
        product_price_id,
        current_user.business_id,
      );
    if (!product_price) {
      throw new NotFoundException('Product price not found.');
    }

    if (dto.price_list_id !== undefined) {
      product_price.price_list_id = (
        await this.inventory_validation_service.get_price_list_in_business(
          current_user.business_id,
          dto.price_list_id,
        )
      ).id;
    }

    const next_valid_from =
      dto.valid_from !== undefined
        ? dto.valid_from
          ? new Date(dto.valid_from)
          : null
        : product_price.valid_from;
    const next_valid_to =
      dto.valid_to !== undefined
        ? dto.valid_to
          ? new Date(dto.valid_to)
          : null
        : product_price.valid_to;

    this.assert_valid_date_range(next_valid_from, next_valid_to);

    if (dto.price !== undefined) {
      product_price.price = dto.price;
    }
    if (dto.min_quantity !== undefined) {
      product_price.min_quantity = dto.min_quantity;
    }
    if (dto.valid_from !== undefined) {
      product_price.valid_from = next_valid_from;
    }
    if (dto.valid_to !== undefined) {
      product_price.valid_to = next_valid_to;
    }
    if (dto.is_active !== undefined) {
      product_price.is_active = dto.is_active;
    }

    const saved_product_price =
      await this.product_prices_repository.save(product_price);
    const hydrated_product_price =
      await this.product_prices_repository.find_by_id_in_business(
        saved_product_price.id,
        current_user.business_id,
      );
    if (!hydrated_product_price) {
      throw new NotFoundException('Product price not found.');
    }

    return this.serialize_product_price(hydrated_product_price);
  }

  private async get_price_list_entity(
    business_id: number,
    price_list_id: number,
  ): Promise<PriceList> {
    const price_list = await this.price_lists_repository.find_by_id_in_business(
      price_list_id,
      business_id,
    );
    if (!price_list) {
      throw new NotFoundException('Price list not found.');
    }

    return price_list;
  }

  private assert_valid_date_range(
    valid_from?: string | Date | null,
    valid_to?: string | Date | null,
  ): void {
    const from = valid_from
      ? valid_from instanceof Date
        ? valid_from
        : new Date(valid_from)
      : null;
    const to = valid_to
      ? valid_to instanceof Date
        ? valid_to
        : new Date(valid_to)
      : null;

    if (from && to && to < from) {
      throw new BadRequestException(
        'valid_to cannot be earlier than valid_from.',
      );
    }
  }

  private serialize_price_list(price_list: PriceList) {
    return {
      id: price_list.id,
      code: price_list.code,
      business_id: price_list.business_id,
      name: price_list.name,
      kind: price_list.kind,
      currency: price_list.currency,
      is_default: price_list.is_default,
      is_active: price_list.is_active,
      created_at: price_list.created_at,
      updated_at: price_list.updated_at,
    };
  }

  private serialize_product_price(product_price: ProductPrice) {
    return {
      id: product_price.id,
      business_id: product_price.business_id,
      product_id: product_price.product_id,
      price_list: product_price.price_list
        ? {
            id: product_price.price_list.id,
            code: product_price.price_list.code,
            name: product_price.price_list.name,
            kind: product_price.price_list.kind,
            currency: product_price.price_list.currency,
          }
        : null,
      price: product_price.price,
      min_quantity: product_price.min_quantity,
      valid_from: product_price.valid_from,
      valid_to: product_price.valid_to,
      is_active: product_price.is_active,
      created_at: product_price.created_at,
      updated_at: product_price.updated_at,
    };
  }
}
