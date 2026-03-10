import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';

@Injectable()
export class PasswordHashService {
  async hash(value: string): Promise<string> {
    return argon2.hash(value, {
      type: argon2.argon2id,
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1,
    });
  }

  async verify(hash: string, value: string): Promise<boolean> {
    return argon2.verify(hash, value);
  }
}
