import { QueryFailedError } from 'typeorm';
import { DomainBadRequestException } from '../errors/exceptions/domain-bad-request.exception';
import { DomainConflictException } from '../errors/exceptions/domain-conflict.exception';
import { BusinessSequenceService } from './business-sequence.service';
import { EntityCodeService } from './entity-code.service';

describe('EntityCodeService', () => {
  let service: EntityCodeService;
  let business_sequence_service: jest.Mocked<BusinessSequenceService>;

  beforeEach(() => {
    business_sequence_service = {
      next_value: jest.fn(),
      format_code: jest.fn(),
    } as unknown as jest.Mocked<BusinessSequenceService>;
    service = new EntityCodeService(business_sequence_service);
  });

  it('throws a domain bad request exception for invalid manual codes', () => {
    expect(() => service.validate_code('US', 'INVALID')).toThrow(
      DomainBadRequestException,
    );

    try {
      service.validate_code('US', 'INVALID');
    } catch (error) {
      const response = (error as DomainBadRequestException).getResponse() as {
        code: string;
        messageKey: string;
        details: Record<string, unknown>;
      };

      expect(response.code).toBe('ENTITY_CODE_INVALID_FORMAT');
      expect(response.messageKey).toBe('common.entity_code_invalid_format');
      expect(response.details).toEqual({
        field: 'code',
        prefix: 'US',
      });
    }
  });

  it('throws a domain conflict exception when generated code assignment hits a unique constraint', async () => {
    const repository = {
      save: jest.fn().mockRejectedValue(
        new QueryFailedError('INSERT INTO users ...', [], {
          code: '23505',
        }),
      ),
      manager: {},
      metadata: {
        tableName: 'users',
      },
    };

    business_sequence_service.next_value.mockResolvedValue(1);

    await expect(
      service.ensure_code(
        repository as never,
        {
          id: 12,
          code: null,
          business_id: 1,
        } as never,
        'US',
      ),
    ).rejects.toBeInstanceOf(DomainConflictException);

    try {
      await service.ensure_code(
        repository as never,
        {
          id: 12,
          code: null,
          business_id: 1,
        } as never,
        'US',
      );
    } catch (error) {
      const response = (error as DomainConflictException).getResponse() as {
        code: string;
        messageKey: string;
        details: Record<string, unknown>;
      };

      expect(response.code).toBe('ENTITY_CODE_ASSIGNMENT_CONFLICT');
      expect(response.messageKey).toBe(
        'common.entity_code_assignment_conflict',
      );
      expect(response.details).toEqual({
        field: 'code',
        prefix: 'US',
      });
    }
  });

  it('uses business-scoped sequences for entities with business_id', async () => {
    const repository = {
      save: jest
        .fn()
        .mockImplementation((entity: { code: string | null }) => entity),
      manager: {},
      metadata: {
        tableName: 'users',
      },
    };

    business_sequence_service.next_value.mockResolvedValue(7);

    const saved_user = await service.ensure_code(
      repository as never,
      {
        id: 99,
        code: null,
        business_id: 3,
      } as never,
      'US',
    );

    expect(business_sequence_service.next_value.mock.calls[0]).toEqual([
      repository.manager,
      3,
      'users:code:US',
    ]);
    expect(saved_user.code).toBe('US-0007');
  });

  it('rethrows non-unique persistence failures without masking them', async () => {
    const repository = {
      save: jest.fn().mockRejectedValue(new Error('database unavailable')),
      manager: {},
      metadata: {
        tableName: 'users',
      },
    };

    business_sequence_service.next_value.mockResolvedValue(1);

    await expect(
      service.ensure_code(
        repository as never,
        {
          id: 12,
          code: null,
          business_id: 1,
        } as never,
        'US',
      ),
    ).rejects.toThrow('database unavailable');
  });
});
