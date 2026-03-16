import { PermissionsRepository } from '../repositories/permissions.repository';
import { PermissionsService } from './permissions.service';

describe('PermissionsService', () => {
  let service: PermissionsService;
  const permissions_repository = {
    find_all: jest.fn(),
  } as unknown as jest.Mocked<PermissionsRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PermissionsService(permissions_repository);
  });

  it('serializes the permission catalog to a stable response shape', async () => {
    permissions_repository.find_all.mockResolvedValue([
      {
        id: 1,
        code: 'PM-0001',
        key: 'users.view',
        module: 'users',
        action: 'view',
        description: 'Ver usuarios',
      },
    ] as never);

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
