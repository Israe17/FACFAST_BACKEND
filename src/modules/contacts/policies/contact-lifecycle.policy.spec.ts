import { DomainBadRequestException } from '../../common/errors/exceptions/domain-bad-request.exception';
import { ContactLifecyclePolicy } from './contact-lifecycle.policy';

describe('ContactLifecyclePolicy', () => {
  let policy: ContactLifecyclePolicy;

  beforeEach(() => {
    policy = new ContactLifecyclePolicy();
  });

  it('rejects deleting contacts with dependencies', () => {
    expect(() =>
      policy.assert_deletable(
        { id: 3 },
        {
          inventory_lots: 1,
          serial_events: 0,
        },
      ),
    ).toThrow(DomainBadRequestException);
  });

  it('allows deleting contacts without dependencies', () => {
    expect(() =>
      policy.assert_deletable(
        { id: 3 },
        {
          inventory_lots: 0,
          serial_events: 0,
        },
      ),
    ).not.toThrow();
  });
});
