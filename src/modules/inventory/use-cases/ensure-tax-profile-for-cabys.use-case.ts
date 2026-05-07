import { Injectable, Logger } from '@nestjs/common';
import { TaxProfile } from '../entities/tax-profile.entity';
import { TaxProfileItemKind } from '../enums/tax-profile-item-kind.enum';
import { TaxType } from '../enums/tax-type.enum';
import { TaxProfilesRepository } from '../repositories/tax-profiles.repository';

const HACIENDA_IVA_RATE_CODES: Record<number, string> = {
  0: '01',
  1: '02',
  2: '03',
  4: '04',
  8: '07',
  13: '08',
};

export type EnsureTaxProfileForCabysCommand = {
  business_id: number;
  cabys_code: string;
  cabys_descripcion: string | null;
  cabys_impuesto: number | null;
  item_kind?: TaxProfileItemKind;
};

@Injectable()
export class EnsureTaxProfileForCabysUseCase {
  private readonly logger = new Logger(EnsureTaxProfileForCabysUseCase.name);

  constructor(
    private readonly tax_profiles_repository: TaxProfilesRepository,
  ) {}

  async execute(
    command: EnsureTaxProfileForCabysCommand,
  ): Promise<TaxProfile | null> {
    const {
      business_id,
      cabys_code,
      cabys_descripcion,
      cabys_impuesto,
      item_kind = TaxProfileItemKind.GOODS,
    } = command;

    const existing =
      await this.tax_profiles_repository.find_active_by_cabys_in_business(
        business_id,
        cabys_code,
      );
    if (existing) {
      return existing;
    }

    const rate = cabys_impuesto ?? 13;
    const tax_type = rate === 0 ? TaxType.EXENTO : TaxType.IVA;
    const base_label =
      cabys_descripcion?.trim().substring(0, 80) || `CABYS ${cabys_code}`;
    let name = `IVA ${rate}% - ${base_label}`;
    if (
      await this.tax_profiles_repository.exists_name_in_business(
        business_id,
        name,
      )
    ) {
      name = `${name} [${cabys_code}]`;
    }

    const tax_profile = this.tax_profiles_repository.create({
      business_id,
      code: null,
      name,
      description: cabys_descripcion ?? null,
      cabys_code,
      item_kind,
      tax_type,
      iva_rate_code:
        tax_type === TaxType.IVA ? HACIENDA_IVA_RATE_CODES[rate] ?? '08' : null,
      iva_rate: tax_type === TaxType.IVA ? rate : null,
      requires_cabys: true,
      allows_exoneration: true,
      has_specific_tax: false,
      specific_tax_name: null,
      specific_tax_rate: null,
      is_active: true,
    });

    try {
      return await this.tax_profiles_repository.save(tax_profile);
    } catch (error) {
      this.logger.warn(
        `Auto-creation of tax profile for CABYS ${cabys_code} failed: ${
          error instanceof Error ? error.message : String(error)
        }. Falling back to existing match if any.`,
      );
      return this.tax_profiles_repository.find_active_by_cabys_in_business(
        business_id,
        cabys_code,
      );
    }
  }
}
