import { Injectable } from '@nestjs/common';
import { QueryUseCase } from '../../common/application/interfaces/query-use-case.interface';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { TerminalView } from '../contracts/terminal.view';
import { TerminalSerializer } from '../serializers/terminal.serializer';
import { BranchesValidationService } from '../services/branches-validation.service';

export type GetTerminalQuery = {
  current_user: AuthenticatedUserContext;
  terminal_id: number;
};

@Injectable()
export class GetTerminalQueryUseCase
  implements QueryUseCase<GetTerminalQuery, TerminalView>
{
  constructor(
    private readonly branches_validation_service: BranchesValidationService,
    private readonly terminal_serializer: TerminalSerializer,
  ) {}

  async execute({
    current_user,
    terminal_id,
  }: GetTerminalQuery): Promise<TerminalView> {
    const terminal =
      await this.branches_validation_service.get_terminal_for_access(
        current_user,
        terminal_id,
      );

    return this.terminal_serializer.serialize(terminal);
  }
}
