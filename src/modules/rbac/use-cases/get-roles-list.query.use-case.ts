import { Injectable } from '@nestjs/common';
import { QueryUseCase } from '../../common/application/interfaces/query-use-case.interface';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { RoleView } from '../contracts/role.view';
import { RolesRepository } from '../repositories/roles.repository';
import { RoleSerializer } from '../serializers/role.serializer';

export type GetRolesListQuery = {
  current_user: AuthenticatedUserContext;
};

@Injectable()
export class GetRolesListQueryUseCase
  implements QueryUseCase<GetRolesListQuery, RoleView[]>
{
  constructor(
    private readonly roles_repository: RolesRepository,
    private readonly role_serializer: RoleSerializer,
  ) {}

  async execute({ current_user }: GetRolesListQuery): Promise<RoleView[]> {
    const roles = await this.roles_repository.find_all_by_business(
      resolve_effective_business_id(current_user),
    );
    return roles.map((role) => this.role_serializer.serialize(role));
  }
}
