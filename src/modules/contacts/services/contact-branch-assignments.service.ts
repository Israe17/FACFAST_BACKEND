import { Injectable } from '@nestjs/common';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { ContactBranchAssignmentView } from '../contracts/contact-branch-assignment.view';
import { ContactBranchAssignmentsView } from '../contracts/contact-branch-assignments.view';
import { CreateContactBranchAssignmentDto } from '../dto/create-contact-branch-assignment.dto';
import { UpdateContactBranchAssignmentDto } from '../dto/update-contact-branch-assignment.dto';
import { CreateContactBranchAssignmentUseCase } from '../use-cases/create-contact-branch-assignment.use-case';
import {
  DeleteContactBranchAssignmentResult,
  DeleteContactBranchAssignmentUseCase,
} from '../use-cases/delete-contact-branch-assignment.use-case';
import { GetContactBranchAssignmentQueryUseCase } from '../use-cases/get-contact-branch-assignment.query.use-case';
import { GetContactBranchAssignmentsQueryUseCase } from '../use-cases/get-contact-branch-assignments.query.use-case';
import { UpdateContactBranchAssignmentUseCase } from '../use-cases/update-contact-branch-assignment.use-case';

@Injectable()
export class ContactBranchAssignmentsService {
  constructor(
    private readonly get_contact_branch_assignments_query_use_case: GetContactBranchAssignmentsQueryUseCase,
    private readonly create_contact_branch_assignment_use_case: CreateContactBranchAssignmentUseCase,
    private readonly get_contact_branch_assignment_query_use_case: GetContactBranchAssignmentQueryUseCase,
    private readonly update_contact_branch_assignment_use_case: UpdateContactBranchAssignmentUseCase,
    private readonly delete_contact_branch_assignment_use_case: DeleteContactBranchAssignmentUseCase,
  ) {}

  async get_contact_branch_assignments(
    current_user: AuthenticatedUserContext,
    contact_id: number,
  ): Promise<ContactBranchAssignmentsView> {
    return this.get_contact_branch_assignments_query_use_case.execute({
      current_user,
      contact_id,
    });
  }

  async create_contact_branch_assignment(
    current_user: AuthenticatedUserContext,
    contact_id: number,
    dto: CreateContactBranchAssignmentDto,
  ): Promise<ContactBranchAssignmentView> {
    return this.create_contact_branch_assignment_use_case.execute({
      current_user,
      contact_id,
      dto,
    });
  }

  async get_contact_branch_assignment(
    current_user: AuthenticatedUserContext,
    assignment_id: number,
  ): Promise<ContactBranchAssignmentView> {
    return this.get_contact_branch_assignment_query_use_case.execute({
      current_user,
      assignment_id,
    });
  }

  async update_contact_branch_assignment_by_id(
    current_user: AuthenticatedUserContext,
    assignment_id: number,
    dto: UpdateContactBranchAssignmentDto,
  ): Promise<ContactBranchAssignmentView> {
    return this.update_contact_branch_assignment_use_case.execute({
      current_user,
      assignment_id,
      dto,
    });
  }

  async update_contact_branch_assignment(
    current_user: AuthenticatedUserContext,
    contact_id: number,
    assignment_id: number,
    dto: UpdateContactBranchAssignmentDto,
  ): Promise<ContactBranchAssignmentView> {
    return this.update_contact_branch_assignment_use_case.execute({
      current_user,
      contact_id,
      assignment_id,
      dto,
    });
  }

  async delete_contact_branch_assignment_by_id(
    current_user: AuthenticatedUserContext,
    assignment_id: number,
  ): Promise<DeleteContactBranchAssignmentResult> {
    return this.delete_contact_branch_assignment_use_case.execute({
      current_user,
      assignment_id,
    });
  }

  async delete_contact_branch_assignment(
    current_user: AuthenticatedUserContext,
    contact_id: number,
    assignment_id: number,
  ): Promise<DeleteContactBranchAssignmentResult> {
    return this.delete_contact_branch_assignment_use_case.execute({
      current_user,
      contact_id,
      assignment_id,
    });
  }
}
