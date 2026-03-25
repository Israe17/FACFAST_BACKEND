import { GetPermissionsListQueryUseCase } from '../use-cases/get-permissions-list.query.use-case';
import { PermissionsService } from './permissions.service';

describe('PermissionsService', () => {
  let service: PermissionsService;
  const get_permissions_list_query_use_case = {
    execute: jest.fn(),
  } as unknown as jest.Mocked<GetPermissionsListQueryUseCase>;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PermissionsService(get_permissions_list_query_use_case);
  });

  it('serializes the permission catalog to a stable response shape', async () => {
    get_permissions_list_query_use_case.execute.mockResolvedValue([
      {
        id: 1,
        code: 'PM-0001',
        key: 'users.view',
        module: 'users',
        action: 'view',
        description: 'Ver usuarios',
      },
    ]);

    await expect(service.find_all()).resolves.toEqual([
      {
        id: 1,
        code: 'PM-0001',
        key: 'users.view',
        module: 'users',
        action: 'view',
        description: 'Ver usuarios',
      },
    ]);
  });
});
