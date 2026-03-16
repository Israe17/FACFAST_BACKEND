import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'crypto';
import { DomainInternalServerException } from '../errors/exceptions/domain-internal-server.exception';

@Injectable()
export class EncryptionService {
  private readonly key: Buffer;

  constructor(private readonly config_service: ConfigService) {
    const secret = this.config_service.get<string>('FIELD_ENCRYPTION_KEY');
    if (!secret) {
      throw new DomainInternalServerException({
        code: 'FIELD_ENCRYPTION_KEY_MISSING',
        messageKey: 'common.field_encryption_key_missing',
      });
    }

    this.key = createHash('sha256').update(secret).digest();
  }

  encrypt(value: string | null | undefined): string | null {
    if (!value) {
      return null;
    }

    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);
    const encrypted = Buffer.concat([
      cipher.update(value, 'utf8'),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();

    return [
      iv.toString('base64url'),
      tag.toString('base64url'),
      encrypted.toString('base64url'),
    ].join('.');
  }

  decrypt(value: string | null | undefined): string | null {
    if (!value) {
      return null;
    }

    const [iv_encoded, tag_encoded, payload_encoded] = value.split('.');
    if (!iv_encoded || !tag_encoded || !payload_encoded) {
      throw new DomainInternalServerException({
        code: 'ENCRYPTED_PAYLOAD_INVALID_FORMAT',
        messageKey: 'common.encrypted_payload_invalid_format',
      });
    }

    const decipher = createDecipheriv(
      'aes-256-gcm',
      this.key,
      Buffer.from(iv_encoded, 'base64url'),
    );
    decipher.setAuthTag(Buffer.from(tag_encoded, 'base64url'));

    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(payload_encoded, 'base64url')),
      decipher.final(),
    ]);
    return decrypted.toString('utf8');
  }
}
