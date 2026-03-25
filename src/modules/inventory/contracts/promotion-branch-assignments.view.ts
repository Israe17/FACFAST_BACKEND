import { PromotionBranchAssignmentView } from './promotion-branch-assignment.view';

export interface PromotionBranchAssignmentsView {
  promotion_id: number;
  assignments: PromotionBranchAssignmentView[];
}
