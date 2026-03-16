import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../app.module';
import { Business } from '../modules/common/entities/business.entity';
import { UserStatus } from '../modules/common/enums/user-status.enum';
import { UserType } from '../modules/common/enums/user-type.enum';
import { EntityCodeService } from '../modules/common/services/entity-code.service';
import { PasswordHashService } from '../modules/common/services/password-hash.service';
import { RolesRepository } from '../modules/rbac/repositories/roles.repository';
import { RbacSeedService } from '../modules/rbac/services/rbac-seed.service';
import { UserRole } from '../modules/users/entities/user-role.entity';
import { UsersRepository } from '../modules/users/repositories/users.repository';

type CliArgs = Record<string, string | undefined>;

function parse_args(argv: string[]): CliArgs {
  const args: CliArgs = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token?.startsWith('--')) {
      continue;
    }

    const key = token.slice(2);
    const value = argv[index + 1];
    args[key] = value?.startsWith('--') ? 'true' : value;
  }

  return args;
}

function require_arg(args: CliArgs, key: string): string {
  const value = args[key];
  if (!value) {
    throw new Error(`Missing required argument --${key}`);
  }

  return value;
}

async function bootstrap() {
  const logger = new Logger('create-owner');
  const args = parse_args(process.argv.slice(2));
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const data_source = app.get(DataSource);
    const business_repository = data_source.getRepository(Business);
    const user_role_repository = data_source.getRepository(UserRole);
    const users_repository = app.get(UsersRepository);
    const roles_repository = app.get(RolesRepository);
    const password_hash_service = app.get(PasswordHashService);
    const entity_code_service = app.get(EntityCodeService);
    const rbac_seed_service = app.get(RbacSeedService);

    const name = require_arg(args, 'name').trim();
    const email = require_arg(args, 'email').trim().toLowerCase();
    const password = require_arg(args, 'password');

    let business: Business | null = null;
    if (args['business-id']) {
      business = await business_repository.findOne({
        where: {
          id: Number(args['business-id']),
        },
      });
      if (!business) {
        throw new Error(`Business ${args['business-id']} was not found.`);
      }
    } else {
      const business_name = require_arg(args, 'business-name').trim();
      const legal_name = require_arg(args, 'legal-name').trim();
      const business_code = args['business-code']?.trim();

      if (business_code) {
        entity_code_service.validate_code('BS', business_code);
      }

      business = business_repository.create({
        code: business_code ?? null,
        name: business_name,
        legal_name,
        is_active: true,
      });
      business = await business_repository.save(business);
      business = await entity_code_service.ensure_code(
        business_repository,
        business,
        'BS',
      );
      logger.log(`Created business ${business.id} (${business.code}).`);
    }

    await rbac_seed_service.seed_base_permissions();
    await rbac_seed_service.ensure_suggested_roles_for_business(business.id);

    if (await users_repository.exists_email(email)) {
      throw new Error(`A user with email ${email} already exists.`);
    }

    const owner_role = await roles_repository.find_by_role_key(
      business.id,
      'owner',
    );
    if (!owner_role) {
      throw new Error('Owner role could not be resolved for the business.');
    }

    const user_code = args['user-code']?.trim();
    if (user_code) {
      entity_code_service.validate_code('US', user_code);
    }

    const owner_user = await users_repository.save(
      users_repository.create({
        business_id: business.id,
        code: user_code ?? null,
        name,
        email,
        password_hash: await password_hash_service.hash(password),
        status: UserStatus.ACTIVE,
        allow_login: true,
        user_type: UserType.OWNER,
        max_sale_discount: 100,
        last_login_at: null,
      }),
    );

    await user_role_repository.save(
      user_role_repository.create({
        user_id: owner_user.id,
        role_id: owner_role.id,
      }),
    );

    logger.log('Owner user created successfully.');
    process.stdout.write(
      `${JSON.stringify(
        {
          business: {
            id: business.id,
            code: business.code,
            name: business.name,
            legal_name: business.legal_name,
          },
          user: {
            id: owner_user.id,
            code: owner_user.code,
            email: owner_user.email,
            name: owner_user.name,
          },
          role: {
            id: owner_role.id,
            code: owner_role.code,
            role_key: owner_role.role_key,
          },
        },
        null,
        2,
      )}\n`,
    );
  } finally {
    await app.close();
  }
}

void bootstrap().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown error';
  process.stderr.write(`${message}\n`);
  process.exit(1);
});
