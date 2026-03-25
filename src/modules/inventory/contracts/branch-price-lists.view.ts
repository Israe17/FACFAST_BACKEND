import { PriceListBranchAssignmentView } from './price-list-branch-assignment.view';

export interface BranchPriceListsView {
  branch_id: number;
  default_price_list_id: number | null;
  assignments: PriceListBranchAssignmentView[];
}
