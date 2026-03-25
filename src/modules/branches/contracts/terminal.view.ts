export interface TerminalView {
  id: number;
  code: string | null;
  branch_id: number;
  terminal_number: string;
  name: string;
  is_active: boolean;
  lifecycle: {
    can_delete: boolean;
    can_deactivate: boolean;
    can_reactivate: boolean;
    reasons: string[];
  };
  created_at: Date;
  updated_at: Date;
}
