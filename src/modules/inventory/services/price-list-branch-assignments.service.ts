import { Injectable } from '@nestjs/common';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { BranchPriceListsView } from '../contracts/branch-price-lists.view';
import { PriceListBranchAssignmentView } from '../contracts/price-list-branch-assignment.view';
import { PriceListBranchAssignmentsView } from '../contracts/price-list-branch-assignments.view';
import { CreatePriceListBranchAssignmentDto } from '../dto/create-price-list-branch-assignment.dto';
import { UpdatePriceListBranchAssignmentDto } from '../dto/update-price-list-branch-assignment.dto';
import { CreatePriceListBranchAssignmentUseCase } from '../use-cases/create-price-list-branch-assignment.use-case';
import {
  DeletePriceListBranchAssignmentResult,
  DeletePriceListBranchAssignmentUseCase,
} from '../use-cases/delete-price-list-branch-assignment.use-case';
import { GetBranchPriceListsQueryUseCase } from '../use-cases/get-branch-price-lists.query.use-case';
import { GetPriceListBranchAssignmentQueryUseCase } from '../use-cases/get-price-list-branch-assignment.query.use-case';
import { GetPriceListBranchAssignmentsQueryUseCase } from '../use-cases/get-price-list-branch-assignments.query.use-case';
import { UpdatePriceListBranchAssignmentUseCase } from '../use-cases/update-price-list-branch-assignment.use-case';

@Injectable()
export class PriceListBranchAssignmentsService {
  constructor(
    private readonly get_price_list_branch_assignments_query_use_case: GetPriceListBranchAssignmentsQueryUseCase,
    private readonly get_branch_price_lists_query_use_case: GetBranchPriceListsQueryUseCase,
    private readonly create_price_list_branch_assignment_use_case: CreatePriceListBranchAssignmentUseCase,
    private readonly get_price_list_branch_assignment_query_use_case: GetPriceListBranchAssignmentQueryUseCase,
    private readonly update_price_list_branch_assignment_use_case: UpdatePriceListBranchAssignmentUseCase,
    private readonly delete_price_list_branch_assignment_use_case: DeletePriceListBranchAssignmentUseCase,
  ) {}

  async get_price_list_branch_assignments(
    current_user: AuthenticatedUserContext,
    price_list_id: number,
  ): Promise<PriceListBranchAssignmentsView> {
    return this.get_price_list_branch_assignments_query_use_case.execute({
      current_user,
      price_list_id,
    });
  }

  async get_branch_price_lists(
    current_user: AuthenticatedUserContext,
    branch_id: number,
  ): Promise<BranchPriceListsView> {
    return this.get_branch_price_lists_query_use_case.execute({
      current_user,
      branch_id,
    });
  }

  async create_price_list_branch_assignment(
    current_user: AuthenticatedUserContext,
    price_list_id: number,
    dto: CreatePriceListBranchAssignmentDto,
  ): Promise<PriceListBranchAssignmentView> {
    return this.create_price_list_branch_assignment_use_case.execute({
      current_user,
      price_list_id,
      dto,
    });
  }

  async get_price_list_branch_assignment(
    current_user: AuthenticatedUserContext,
    assignment_id: number,
  ): Promise<PriceListBranchAssignmentView> {
    return this.get_price_list_branch_assignment_query_use_case.execute({
      current_user,
      assignment_id,
    });
  }

  async update_price_list_branch_assignment_by_id(
    current_user: AuthenticatedUserContext,
    assignment_id: number,
    dto: UpdatePriceListBranchAssignmentDto,
  ): Promise<PriceListBranchAssignmentView> {
    return this.update_price_list_branch_assignment_use_case.execute({
      current_user,
      assignment_id,
      dto,
    });
  }

  async update_price_list_branch_assignment(
    current_user: AuthenticatedUserContext,
    price_list_id: number,
    assignment_id: number,
    dto: UpdatePriceListBranchAssignmentDto,
  ): Promise<PriceListBranchAssignmentView> {
    return this.update_price_list_branch_assignment_use_case.execute({
      current_user,
      assignment_id,
      dto,
      price_list_id,
    });
  }

  async delete_price_list_branch_assignment_by_id(
    current_user: AuthenticatedUserContext,
    assignment_id: number,
  ): Promise<DeletePriceListBranchAssignmentResult> {
    return this.delete_price_list_branch_assignment_use_case.execute({
      current_user,
      assignment_id,
    });
  }

  async delete_price_list_branch_assignment(
    current_user: AuthenticatedUserContext,
    price_list_id: number,
    assignment_id: number,
  ): Promise<DeletePriceListBranchAssignmentResult> {
    return this.delete_price_list_branch_assignment_use_case.execute({
      current_user,
      assignment_id,
      price_list_id,
    });
  }
}
