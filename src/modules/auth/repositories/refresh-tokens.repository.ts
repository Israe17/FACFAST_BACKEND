import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EntityCodeService } from '../../common/services/entity-code.service';
import { RefreshToken } from '../entities/refresh-token.entity';

@Injectable()
export class RefreshTokensRepository {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly refresh_token_repository: Repository<RefreshToken>,
    private readonly entity_code_service: EntityCodeService,
  ) {}

  create(payload: Partial<RefreshToken>): RefreshToken {
    return this.refresh_token_repository.create(payload);
  }

  async save(refresh_token: RefreshToken): Promise<RefreshToken> {
    const saved_refresh_token =
      await this.refresh_token_repository.save(refresh_token);
    return this.entity_code_service.ensure_code(
      this.refresh_token_repository,
      saved_refresh_token,
      'RT',
    );
  }

  async find_by_id_with_hash(id: number): Promise<RefreshToken | null> {
    return this.refresh_token_repository
      .createQueryBuilder('refresh_token')
      .addSelect('refresh_token.token_hash')
      .where('refresh_token.id = :id', { id })
      .getOne();
  }

  async revoke(session_id: number): Promise<void> {
    await this.refresh_token_repository
      .createQueryBuilder()
      .update(RefreshToken)
      .set({
        revoked_at: new Date(),
      })
      .where('id = :session_id', { session_id })
      .andWhere('revoked_at IS NULL')
      .execute();
  }
}
