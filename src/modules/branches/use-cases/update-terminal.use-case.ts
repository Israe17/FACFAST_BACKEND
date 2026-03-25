import { Injectable } from '@nestjs/common';
import { CommandUseCase } from '../../common/application/interfaces/command-use-case.interface';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { EntityCodeService } from '../../common/services/entity-code.service';
import { TerminalView } from '../contracts/terminal.view';
import { UpdateTerminalDto } from '../dto/update-terminal.dto';
import { TerminalsRepository } from '../repositories/terminals.repository';
import { TerminalSerializer } from '../serializers/terminal.serializer';
import { BranchesValidationService } from '../services/branches-validation.service';

export type UpdateTerminalCommand = {
  current_user: AuthenticatedUserContext;
  terminal_id: number;
  dto: UpdateTerminalDto;
};

@Injectable()
export class UpdateTerminalUseCase
  implements CommandUseCase<UpdateTerminalCommand, TerminalView>
{
  constructor(
    private readonly terminals_repository: TerminalsRepository,
    private readonly branches_validation_service: BranchesValidationService,
    private readonly entity_code_service: EntityCodeService,
    private readonly terminal_serializer: TerminalSerializer,
  ) {}

  async execute({
    current_user,
    terminal_id,
    dto,
  }: UpdateTerminalCommand): Promise<TerminalView> {
    const terminal =
      await this.branches_validation_service.get_terminal_for_access(
        current_user,
        terminal_id,
      );

    if (dto.code) {
      this.entity_code_service.validate_code('TR', dto.code);
      terminal.code = dto.code;
    }
    if (dto.terminal_number) {
      terminal.terminal_number = dto.terminal_number.trim();
    }
    if (dto.name) {
      terminal.name = dto.name.trim();
    }
    if (dto.is_active !== undefined) {
      terminal.is_active = dto.is_active;
    }

    const saved_terminal = await this.terminals_repository.save(terminal);
    return this.terminal_serializer.serialize(saved_terminal);
  }
}
