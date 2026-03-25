import { Injectable } from '@nestjs/common';
import { EntitySerializer } from '../../common/application/interfaces/entity-serializer.interface';
import { IdentificationType } from '../../common/enums/identification-type.enum';
import { BranchView } from '../contracts/branch.view';
import { Branch } from '../entities/branch.entity';
import { TerminalSerializer } from './terminal.serializer';

@Injectable()
export class BranchSerializer implements EntitySerializer<Branch, BranchView> {
  constructor(private readonly terminal_serializer: TerminalSerializer) {}

  serialize(branch: Branch): BranchView {
    return {
      id: branch.id,
      code: branch.code,
      business_id: branch.business_id,
      business_name: branch.business_name,
      name: branch.name ?? branch.business_name,
      legal_name: branch.legal_name,
      identification_type: branch.identification_type ?? IdentificationType.LEGAL,
      identification_number:
        branch.identification_number ?? branch.cedula_juridica,
      cedula_juridica: branch.cedula_juridica,
      branch_number: branch.branch_number,
      address: branch.address,
      province: branch.province,
      canton: branch.canton,
      district: branch.district,
      city: branch.city,
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
      lifecycle: {
        can_delete: true,
        can_deactivate: branch.is_active,
        can_reactivate: !branch.is_active,
        reasons: [],
      },
      created_at: branch.created_at,
      updated_at: branch.updated_at,
      terminals:
        branch.terminals?.map((terminal) =>
          this.terminal_serializer.serialize(terminal),
        ) ?? [],
    };
  }
}
