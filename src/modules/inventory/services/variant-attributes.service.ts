import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DomainBadRequestException } from '../../common/errors/exceptions/domain-bad-request.exception';
import { Product } from '../entities/product.entity';
import { ProductVariant } from '../entities/product-variant.entity';
import { VariantAttribute } from '../entities/variant-attribute.entity';
import { VariantAttributeValue } from '../entities/variant-attribute-value.entity';
import { ProductVariantsRepository } from '../repositories/product-variants.repository';

type AttributeInput = {
  name: string;
  display_order?: number;
  values: { value: string; display_order?: number }[];
};

@Injectable()
export class VariantAttributesService {
  constructor(
    @InjectRepository(VariantAttribute)
    private readonly attribute_repository: Repository<VariantAttribute>,
    @InjectRepository(VariantAttributeValue)
    private readonly attribute_value_repository: Repository<VariantAttributeValue>,
    @InjectRepository(ProductVariant)
    private readonly product_variant_repository: Repository<ProductVariant>,
    private readonly product_variants_repository: ProductVariantsRepository,
  ) {}

  async set_attributes(
    business_id: number,
    product: Product,
    attributes: AttributeInput[],
  ): Promise<VariantAttribute[]> {
    if (!product.has_variants) {
      throw new DomainBadRequestException({
        code: 'PRODUCT_DOES_NOT_SUPPORT_VARIANTS',
        messageKey: 'inventory.product_does_not_support_variants',
        details: { product_id: product.id },
      });
    }

    const existing_attributes = await this.attribute_repository.find({
      where: { business_id, product_id: product.id },
      relations: { values: true },
    });

    const existing_map = new Map(
      existing_attributes.map((a) => [a.name.toLowerCase(), a]),
    );
    const incoming_names = new Set(
      attributes.map((a) => a.name.trim().toLowerCase()),
    );

    for (const existing of existing_attributes) {
      if (!incoming_names.has(existing.name.toLowerCase())) {
        await this.attribute_repository.remove(existing);
      }
    }

    const result: VariantAttribute[] = [];

    for (let i = 0; i < attributes.length; i++) {
      const input = attributes[i];
      const name = input.name.trim();
      const existing = existing_map.get(name.toLowerCase());

      if (existing) {
        existing.display_order = input.display_order ?? i;
        const saved_attr = await this.attribute_repository.save(existing);

        const existing_values_map = new Map(
          (existing.values ?? []).map((v) => [v.value.toLowerCase(), v]),
        );
        const incoming_values = new Set(
          input.values.map((v) => v.value.trim().toLowerCase()),
        );

        for (const ev of existing.values ?? []) {
          if (!incoming_values.has(ev.value.toLowerCase())) {
            await this.attribute_value_repository.remove(ev);
          }
        }

        for (let j = 0; j < input.values.length; j++) {
          const val_input = input.values[j];
          const val_name = val_input.value.trim();
          const existing_val = existing_values_map.get(val_name.toLowerCase());

          if (existing_val) {
            existing_val.display_order = val_input.display_order ?? j;
            await this.attribute_value_repository.save(existing_val);
          } else {
            await this.attribute_value_repository.save(
              this.attribute_value_repository.create({
                business_id,
                attribute_id: saved_attr.id,
                value: val_name,
                display_order: val_input.display_order ?? j,
              }),
            );
          }
        }

        result.push(saved_attr);
      } else {
        const new_attr = await this.attribute_repository.save(
          this.attribute_repository.create({
            business_id,
            product_id: product.id,
            name,
            display_order: input.display_order ?? i,
          }),
        );

        for (let j = 0; j < input.values.length; j++) {
          const val_input = input.values[j];
          await this.attribute_value_repository.save(
            this.attribute_value_repository.create({
              business_id,
              attribute_id: new_attr.id,
              value: val_input.value.trim(),
              display_order: val_input.display_order ?? j,
            }),
          );
        }

        result.push(new_attr);
      }
    }

    return this.get_attributes(business_id, product.id);
  }

  async generate_variants(
    business_id: number,
    product: Product,
  ): Promise<ProductVariant[]> {
    if (!product.has_variants) {
      throw new DomainBadRequestException({
        code: 'PRODUCT_DOES_NOT_SUPPORT_VARIANTS',
        messageKey: 'inventory.product_does_not_support_variants',
        details: { product_id: product.id },
      });
    }

    const attributes = await this.get_attributes(business_id, product.id);

    if (!attributes.length) {
      throw new DomainBadRequestException({
        code: 'NO_ATTRIBUTES_DEFINED',
        messageKey: 'inventory.no_attributes_defined',
        details: { product_id: product.id },
      });
    }

    const value_groups = attributes.map((attr) => attr.values ?? []);

    const combinations = this.cartesian_product(value_groups);

    const existing_variants =
      await this.product_variants_repository.find_all_by_product_in_business(
        business_id,
        product.id,
      );

    const existing_combos = new Set<string>();
    for (const variant of existing_variants) {
      if (variant.attribute_values?.length) {
        const key = variant.attribute_values
          .map((av) => av.id)
          .sort((a, b) => a - b)
          .join(',');
        existing_combos.add(key);
      }
    }

    const created: ProductVariant[] = [];
    const product_sku = product.sku ?? `PD-${product.id}`;

    for (const combo of combinations) {
      const combo_key = combo
        .map((v) => v.id)
        .sort((a, b) => a - b)
        .join(',');

      if (existing_combos.has(combo_key)) {
        continue;
      }

      const variant_name = combo.map((v) => v.value).join(' - ');
      const sku_suffix = combo
        .map((v) => v.value.slice(0, 4).toUpperCase().replace(/\s/g, ''))
        .join('-');
      const sku = `${product_sku}-${sku_suffix}`;

      const sku_exists =
        await this.product_variants_repository.exists_sku_in_business(
          business_id,
          sku,
        );

      const final_sku = sku_exists ? `${sku}-${Date.now()}` : sku;

      const variant = this.product_variant_repository.create({
        business_id,
        product_id: product.id,
        sku: final_sku,
        barcode: null,
        variant_name,
        stock_unit_measure_id: product.stock_unit_id,
        sale_unit_measure_id: product.sale_unit_id,
        fiscal_profile_id: product.tax_profile_id,
        default_warranty_profile_id: product.has_warranty
          ? product.warranty_profile_id
          : null,
        is_default: false,
        track_inventory: product.track_inventory,
        track_lots: product.track_lots,
        track_expiration: product.track_expiration,
        track_serials: product.track_serials,
        allow_negative_stock: product.allow_negative_stock,
        is_active: product.is_active,
      });

      const saved_variant = await this.product_variant_repository.save(variant);
      saved_variant.attribute_values = combo;
      await this.product_variant_repository.save(saved_variant);
      created.push(saved_variant);
    }

    return created;
  }

  async get_attributes(
    business_id: number,
    product_id: number,
  ): Promise<VariantAttribute[]> {
    return this.attribute_repository.find({
      where: { business_id, product_id },
      relations: { values: true },
      order: {
        display_order: 'ASC',
        values: { display_order: 'ASC' },
      },
    });
  }

  private cartesian_product(
    groups: VariantAttributeValue[][],
  ): VariantAttributeValue[][] {
    if (!groups.length) {
      return [];
    }

    return groups.reduce<VariantAttributeValue[][]>(
      (acc, group) => {
        const result: VariantAttributeValue[][] = [];
        for (const existing of acc) {
          for (const value of group) {
            result.push([...existing, value]);
          }
        }
        return result;
      },
      [[]],
    );
  }
}
