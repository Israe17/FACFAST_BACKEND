import { PasswordHashService } from './password-hash.service';

describe('PasswordHashService', () => {
  let service: PasswordHashService;

  beforeEach(() => {
    service = new PasswordHashService();
  });

  it('hashes and verifies a password with argon2id', async () => {
    const password = 'StrongPassword123';
    const hash = await service.hash(password);

    expect(hash).not.toBe(password);
    await expect(service.verify(hash, password)).resolves.toBe(true);
    await expect(service.verify(hash, 'WrongPassword123')).resolves.toBe(false);
  });
});
