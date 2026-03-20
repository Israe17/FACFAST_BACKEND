import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EntityCodeService } from '../../common/services/entity-code.service';
import { Terminal } from '../entities/terminal.entity';

@Injectable()
export class TerminalsRepository {
  constructor(
    @InjectRepository(Terminal)
    private readonly terminal_repository: Repository<Terminal>,
    private readonly entity_code_service: EntityCodeService,
  ) {}

  create(payload: Partial<Terminal>): Terminal {
    return this.terminal_repository.create(payload);
  }

  async save(terminal: Terminal): Promise<Terminal> {
    const saved_terminal = await this.terminal_repository.save(terminal);
    return this.entity_code_service.ensure_code(
      this.terminal_repository,
      saved_terminal,
      'TR',
    );
  }

  async remove(terminal: Terminal): Promise<void> {
    await this.terminal_repository.remove(terminal);
  }

  async find_by_id_with_branch(id: number): Promise<Terminal | null> {
    return this.terminal_repository.findOne({
      where: {
        id,
      },
      relations: {
        branch: true,
      },
    });
  }
}
