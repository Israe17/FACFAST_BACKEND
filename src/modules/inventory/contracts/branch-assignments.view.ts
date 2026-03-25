export interface BranchAssignmentsView {
  id: number;
  code: string | null;
  name: string;
  is_global: boolean;
  assigned_branch_ids: number[];
  assigned_branches: Array<{
    id: number;
    name: string | null;
  }>;
}
