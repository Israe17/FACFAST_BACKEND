import { PromotionBranchAssignmentView } from './promotion-branch-assignment.view';

export interface BranchPromotionsView {
  branch_id: number;
  assignments: PromotionBranchAssignmentView[];
}
