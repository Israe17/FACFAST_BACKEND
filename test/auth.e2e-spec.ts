import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { configure_app } from '../src/configure-app';
import { Branch } from '../src/modules/branches/entities/branch.entity';
import { Business } from '../src/modules/common/entities/business.entity';
import { UserStatus } from '../src/modules/common/enums/user-status.enum';
import { UserType } from '../src/modules/common/enums/user-type.enum';
import { EntityCodeService } from '../src/modules/common/services/entity-code.service';
import { PasswordHashService } from '../src/modules/common/services/password-hash.service';
import { RolesRepository } from '../src/modules/rbac/repositories/roles.repository';
import { RbacSeedService } from '../src/modules/rbac/services/rbac-seed.service';
import { UserBranchAccess } from '../src/modules/users/entities/user-branch-access.entity';
import { UserRole } from '../src/modules/users/entities/user-role.entity';
import { UsersRepository } from '../src/modules/users/repositories/users.repository';

jest.setTimeout(30000);

describe('Auth and Security (e2e)', () => {
  let app: INestApplication;
  let http_server: App;
  let business_one_id: number;
  let business_one_branch_one_id: number;
  let business_one_branch_two_id: number;
  let business_two_branch_id: number;
  let business_one_cashier_id: number;
  let app_module: { AppModule: new (...args: never[]) => unknown };

  beforeAll(async () => {
    process.env.PORT = '0';
    process.env.CORS_ORIGIN = 'http://localhost:3000';
    process.env.DB_USE_PG_MEM = 'true';
    process.env.JWT_ACCESS_SECRET = 'access-secret';
    process.env.JWT_REFRESH_SECRET = 'refresh-secret';
    process.env.JWT_ACCESS_EXPIRES_IN = '15m';
    process.env.JWT_REFRESH_EXPIRES_IN = '7d';
    process.env.AUTH_COOKIE_SECURE = 'false';
    process.env.AUTH_COOKIE_SAME_SITE = 'lax';
    process.env.FIELD_ENCRYPTION_KEY = 'test-field-encryption-key';
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    app_module = require('../src/app.module') as {
      AppModule: new (...args: never[]) => unknown;
    };

    const module_fixture: TestingModule = await Test.createTestingModule({
      imports: [app_module.AppModule],
    }).compile();

    app = module_fixture.createNestApplication();
    configure_app(app);
    await app.init();
    http_server = app.getHttpServer() as unknown as App;

    const data_source = app.get(DataSource);
    const business_repository = data_source.getRepository(Business);
    const branch_repository = data_source.getRepository(Branch);
    const user_role_repository = data_source.getRepository(UserRole);
    const user_branch_access_repository =
      data_source.getRepository(UserBranchAccess);
    const users_repository = app.get(UsersRepository);
    const roles_repository = app.get(RolesRepository);
    const password_hash_service = app.get(PasswordHashService);
    const entity_code_service = app.get(EntityCodeService);
    const rbac_seed_service = app.get(RbacSeedService);

    const business_one = await entity_code_service.ensure_code(
      business_repository,
      await business_repository.save(
        business_repository.create({
          code: null,
          name: 'Business One',
          legal_name: 'Business One SA',
          is_active: true,
        }),
      ),
      'BS',
    );
    const business_two = await entity_code_service.ensure_code(
      business_repository,
      await business_repository.save(
        business_repository.create({
          code: null,
          name: 'Business Two',
          legal_name: 'Business Two SA',
          is_active: true,
        }),
      ),
      'BS',
    );

    await rbac_seed_service.seed_base_permissions();
    await rbac_seed_service.ensure_suggested_roles_for_business(
      business_one.id,
    );
    await rbac_seed_service.ensure_suggested_roles_for_business(
      business_two.id,
    );

    const admin_role = await roles_repository.find_by_role_key(
      business_one.id,
      'admin',
    );
    const cashier_role = await roles_repository.find_by_role_key(
      business_one.id,
      'cashier',
    );
    if (!admin_role || !cashier_role) {
      throw new Error('Seeded roles were not found.');
    }

    const branch_one = await entity_code_service.ensure_code(
      branch_repository,
      await branch_repository.save(
        branch_repository.create({
          code: null,
          business_id: business_one.id,
          business_name: 'Business One',
          legal_name: 'Business One SA',
          cedula_juridica: '3101123456',
          branch_number: '001',
          address: 'San Jose Centro',
          province: 'San Jose',
          canton: 'Central',
          district: 'Catedral',
          phone: null,
          email: null,
          activity_code: null,
          provider_code: null,
          cert_path: null,
          crypto_key_encrypted: null,
          hacienda_username: null,
          hacienda_password_encrypted: null,
          mail_key_encrypted: null,
          signature_type: null,
          is_active: true,
        }),
      ),
      'BR',
    );
    const branch_two = await entity_code_service.ensure_code(
      branch_repository,
      await branch_repository.save(
        branch_repository.create({
          code: null,
          business_id: business_one.id,
          business_name: 'Business One',
          legal_name: 'Business One SA',
          cedula_juridica: '3101123456',
          branch_number: '002',
          address: 'Heredia Centro',
          province: 'Heredia',
          canton: 'Central',
          district: 'Mercedes',
          phone: null,
          email: null,
          activity_code: null,
          provider_code: null,
          cert_path: null,
          crypto_key_encrypted: null,
          hacienda_username: null,
          hacienda_password_encrypted: null,
          mail_key_encrypted: null,
          signature_type: null,
          is_active: true,
        }),
      ),
      'BR',
    );
    const branch_other_business = await entity_code_service.ensure_code(
      branch_repository,
      await branch_repository.save(
        branch_repository.create({
          code: null,
          business_id: business_two.id,
          business_name: 'Business Two',
          legal_name: 'Business Two SA',
          cedula_juridica: '3101123457',
          branch_number: '001',
          address: 'Alajuela Centro',
          province: 'Alajuela',
          canton: 'Central',
          district: 'Alajuela',
          phone: null,
          email: null,
          activity_code: null,
          provider_code: null,
          cert_path: null,
          crypto_key_encrypted: null,
          hacienda_username: null,
          hacienda_password_encrypted: null,
          mail_key_encrypted: null,
          signature_type: null,
          is_active: true,
        }),
      ),
      'BR',
    );

    const admin_user = await users_repository.save(
      users_repository.create({
        business_id: business_one.id,
        code: null,
        name: 'Admin User',
        email: 'admin@business-one.test',
        password_hash: await password_hash_service.hash('Password123'),
        status: UserStatus.ACTIVE,
        allow_login: true,
        user_type: UserType.STAFF,
        max_sale_discount: 0,
        last_login_at: null,
      }),
    );
    const cashier_user = await users_repository.save(
      users_repository.create({
        business_id: business_one.id,
        code: null,
        name: 'Cashier User',
        email: 'cashier@business-one.test',
        password_hash: await password_hash_service.hash('Password123'),
        status: UserStatus.ACTIVE,
        allow_login: true,
        user_type: UserType.STAFF,
        max_sale_discount: 5,
        last_login_at: null,
      }),
    );

    await user_role_repository.save(
      user_role_repository.create({
        user_id: admin_user.id,
        role_id: admin_role.id,
      }),
    );
    await user_role_repository.save(
      user_role_repository.create({
        user_id: cashier_user.id,
        role_id: cashier_role.id,
      }),
    );

    await user_branch_access_repository.save(
      user_branch_access_repository.create({
        user_id: admin_user.id,
        branch_id: branch_one.id,
      }),
    );
    await user_branch_access_repository.save(
      user_branch_access_repository.create({
        user_id: cashier_user.id,
        branch_id: branch_one.id,
      }),
    );

    business_one_id = business_one.id;
    business_one_branch_one_id = branch_one.id;
    business_one_branch_two_id = branch_two.id;
    business_two_branch_id = branch_other_business.id;
    business_one_cashier_id = cashier_user.id;
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('supports login -> me -> refresh -> logout with cookies', async () => {
    const agent = request.agent(http_server);

    const login_response = await agent.post('/auth/login').send({
      business_id: business_one_id,
      email: 'admin@business-one.test',
      password: 'Password123',
    });
    const login_body = login_response.body as { user: { email: string } };

    expect(login_response.status).toBe(200);
    expect(login_body.user.email).toBe('admin@business-one.test');
    expect(login_response.headers['set-cookie']).toEqual(
      expect.arrayContaining([
        expect.stringContaining('ff_access_token='),
        expect.stringContaining('ff_refresh_token='),
      ]),
    );

    const me_response = await agent.get('/auth/me');
    const me_body = me_response.body as {
      permissions: string[];
      branch_ids: number[];
    };
    expect(me_response.status).toBe(200);
    expect(me_body.permissions).toContain('users.view');
    expect(me_body.branch_ids).toEqual([business_one_branch_one_id]);

    const refresh_response = await agent.post('/auth/refresh');
    expect(refresh_response.status).toBe(200);
    expect(refresh_response.headers['set-cookie']).toEqual(
      expect.arrayContaining([expect.stringContaining('ff_refresh_token=')]),
    );

    const logout_response = await agent.post('/auth/logout');
    expect(logout_response.status).toBe(200);

    const me_after_logout = await agent.get('/auth/me');
    expect(me_after_logout.status).toBe(401);
  });

  it('denies branch access outside the assigned branch scope', async () => {
    const agent = request.agent(http_server);
    await agent.post('/auth/login').send({
      business_id: business_one_id,
      email: 'admin@business-one.test',
      password: 'Password123',
    });

    const response = await agent.get(`/branches/${business_one_branch_two_id}`);
    expect(response.status).toBe(403);
  });

  it('denies cross-business branch access', async () => {
    const agent = request.agent(http_server);
    await agent.post('/auth/login').send({
      business_id: business_one_id,
      email: 'admin@business-one.test',
      password: 'Password123',
    });

    const response = await agent.get(`/branches/${business_two_branch_id}`);
    expect(response.status).toBe(404);
  });

  it('denies access when permissions are missing', async () => {
    const agent = request.agent(http_server);
    await agent.post('/auth/login').send({
      business_id: business_one_id,
      email: 'cashier@business-one.test',
      password: 'Password123',
    });

    const response = await agent.get('/users');
    expect(response.status).toBe(403);
  });

  it('rejects invalid cross-business branch assignments', async () => {
    const agent = request.agent(http_server);
    await agent.post('/auth/login').send({
      business_id: business_one_id,
      email: 'admin@business-one.test',
      password: 'Password123',
    });

    const response = await agent
      .put(`/users/${business_one_cashier_id}/branches`)
      .send({
        branch_ids: [business_two_branch_id],
      });
    expect(response.status).toBe(403);
  });
});
