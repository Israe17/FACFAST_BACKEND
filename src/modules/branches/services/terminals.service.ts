import { Injectable } from '@nestjs/common';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { TerminalView } from '../contracts/terminal.view';
import { CreateTerminalDto } from '../dto/create-terminal.dto';
import { UpdateTerminalDto } from '../dto/update-terminal.dto';
import { CreateTerminalUseCase } from '../use-cases/create-terminal.use-case';
import {
  DeleteTerminalResult,
  DeleteTerminalUseCase,
} from '../use-cases/delete-terminal.use-case';
import { GetTerminalQueryUseCase } from '../use-cases/get-terminal.query.use-case';
import { UpdateTerminalUseCase } from '../use-cases/update-terminal.use-case';

@Injectable()
export class TerminalsService {
  constructor(
    private readonly create_terminal_use_case: CreateTerminalUseCase,
    private readonly get_terminal_query_use_case: GetTerminalQueryUseCase,
    private readonly update_terminal_use_case: UpdateTerminalUseCase,
    private readonly delete_terminal_use_case: DeleteTerminalUseCase,
  ) {}

  async create_terminal(
    current_user: AuthenticatedUserContext,
    branch_id: number,
    dto: CreateTerminalDto,
  ): Promise<TerminalView> {
    return this.create_terminal_use_case.execute({
      current_user,
      branch_id,
      dto,
    });
  }

  async get_terminal(
    current_user: AuthenticatedUserContext,
    terminal_id: number,
  ): Promise<TerminalView> {
    return this.get_terminal_query_use_case.execute({
      current_user,
      terminal_id,
    });
  }

  async update_terminal(
    current_user: AuthenticatedUserContext,
    terminal_id: number,
    dto: UpdateTerminalDto,
  ): Promise<TerminalView> {
    return this.update_terminal_use_case.execute({
      current_user,
      terminal_id,
      dto,
    });
  }

  async delete_terminal(
    current_user: AuthenticatedUserContext,
    terminal_id: number,
  ): Promise<DeleteTerminalResult> {
    return this.delete_terminal_use_case.execute({
      current_user,
      terminal_id,
    });
  }
}
