import { ContactBranchAssignmentView } from './contact-branch-assignment.view';

export interface ContactBranchAssignmentsView {
  contact_id: number;
  mode: 'global' | 'scoped';
  global_applies_to_all_branches: boolean;
  assignments: ContactBranchAssignmentView[];
}
