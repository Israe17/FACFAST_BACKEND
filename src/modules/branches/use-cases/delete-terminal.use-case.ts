import { Injectable } from '@nestjs/common';
import { CommandUseCase } from '../../common/application/interfaces/command-use-case.interface';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { TerminalsRepository } from '../repositories/terminals.repository';
import { BranchesValidationService } from '../services/branches-validation.service';

export type DeleteTerminalCommand = {
  current_user: AuthenticatedUserContext;
  terminal_id: number;
};

export type DeleteTerminalResult = {
  id: number;
  deleted: true;
};

@Injectable()
export class DeleteTerminalUseCase
  implements CommandUseCase<DeleteTerminalCommand, DeleteTerminalResult>
{
  constructor(
    private readonly branches_validation_service: BranchesValidationService,
    private readonly terminals_repository: TerminalsRepository,
  ) {}

  async execute({
    current_user,
    terminal_id,
  }: DeleteTerminalCommand): Promise<DeleteTerminalResult> {
    const terminal =
      await this.branches_validation_service.get_terminal_for_access(
        current_user,
        terminal_id,
      );
    await this.terminals_repository.remove(terminal);
    return {
      id: terminal_id,
      deleted: true,
    };
  }
}
