import { PriceListBranchAssignmentView } from './price-list-branch-assignment.view';

export interface PriceListBranchAssignmentsView {
  price_list_id: number;
  assignments: PriceListBranchAssignmentView[];
}
