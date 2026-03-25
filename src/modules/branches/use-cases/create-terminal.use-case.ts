import { Injectable } from '@nestjs/common';
import { CommandUseCase } from '../../common/application/interfaces/command-use-case.interface';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { EntityCodeService } from '../../common/services/entity-code.service';
import { CreateTerminalDto } from '../dto/create-terminal.dto';
import { TerminalView } from '../contracts/terminal.view';
import { TerminalsRepository } from '../repositories/terminals.repository';
import { TerminalSerializer } from '../serializers/terminal.serializer';
import { BranchesValidationService } from '../services/branches-validation.service';

export type CreateTerminalCommand = {
  current_user: AuthenticatedUserContext;
  branch_id: number;
  dto: CreateTerminalDto;
};

@Injectable()
export class CreateTerminalUseCase
  implements CommandUseCase<CreateTerminalCommand, TerminalView>
{
  constructor(
    private readonly terminals_repository: TerminalsRepository,
    private readonly branches_validation_service: BranchesValidationService,
    private readonly entity_code_service: EntityCodeService,
    private readonly terminal_serializer: TerminalSerializer,
  ) {}

  async execute({
    current_user,
    branch_id,
    dto,
  }: CreateTerminalCommand): Promise<TerminalView> {
    const branch = await this.branches_validation_service.get_branch_for_access(
      current_user,
      branch_id,
    );
    if (dto.code) {
      this.entity_code_service.validate_code('TR', dto.code);
    }

    const terminal = this.terminals_repository.create({
      branch_id: branch.id,
      code: dto.code ?? null,
      terminal_number: dto.terminal_number.trim(),
      name: dto.name.trim(),
      is_active: dto.is_active ?? true,
    });

    const saved_terminal = await this.terminals_repository.save(terminal);
    return this.terminal_serializer.serialize(saved_terminal);
  }
}
