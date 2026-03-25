import { Injectable } from '@nestjs/common';
import { EntitySerializer } from '../../common/application/interfaces/entity-serializer.interface';
import { TerminalView } from '../contracts/terminal.view';
import { Terminal } from '../entities/terminal.entity';

@Injectable()
export class TerminalSerializer
  implements EntitySerializer<Terminal, TerminalView>
{
  serialize(terminal: Terminal): TerminalView {
    return {
      id: terminal.id,
      code: terminal.code,
      branch_id: terminal.branch_id,
      terminal_number: terminal.terminal_number,
      name: terminal.name,
      is_active: terminal.is_active,
      lifecycle: {
        can_delete: true,
        can_deactivate: terminal.is_active,
        can_reactivate: !terminal.is_active,
        reasons: [],
      },
      created_at: terminal.created_at,
      updated_at: terminal.updated_at,
    };
  }
}
