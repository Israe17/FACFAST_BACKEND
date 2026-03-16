import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../app.module';
import { Business } from '../modules/common/entities/business.entity';
import { UserStatus } from '../modules/common/enums/user-status.enum';
import { UserType } from '../modules/common/enums/user-type.enum';
import { EntityCodeService } from '../modules/common/services/entity-code.service';
import { PasswordHashService } from '../modules/common/services/password-hash.service';
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
  const logger = new Logger('create-platform-admin');
  const args = parse_args(process.argv.slice(2));
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const users_repository = app.get(UsersRepository);
    const password_hash_service = app.get(PasswordHashService);
    const entity_code_service = app.get(EntityCodeService);
    const business_repository = app.get(DataSource).getRepository(Business);

    const business_id = Number(require_arg(args, 'business-id'));
    const name = require_arg(args, 'name').trim();
    const email = require_arg(args, 'email').trim().toLowerCase();
    const password = require_arg(args, 'password');
    const user_code = args['user-code']?.trim();

    const business = await business_repository.findOne({
      where: {
        id: business_id,
      },
    });
    if (!business) {
      throw new Error(`Business ${business_id} was not found.`);
    }

    if (await users_repository.exists_email(email)) {
      throw new Error(`A user with email ${email} already exists.`);
    }

    if (user_code) {
      entity_code_service.validate_code('US', user_code);
    }

    const platform_admin = await users_repository.save(
      users_repository.create({
        business_id: business.id,
        code: user_code ?? null,
        name,
        email,
        password_hash: await password_hash_service.hash(password),
        status: UserStatus.ACTIVE,
        allow_login: true,
        user_type: UserType.SYSTEM,
        is_platform_admin: true,
        max_sale_discount: 0,
        last_login_at: null,
      }),
    );

    logger.log(`Platform admin ${platform_admin.id} created successfully.`);
    process.stdout.write(
      `${JSON.stringify(
        {
          business: {
            id: business.id,
            code: business.code,
            name: business.name,
          },
          user: {
            id: platform_admin.id,
            code: platform_admin.code,
            email: platform_admin.email,
            name: platform_admin.name,
            is_platform_admin: platform_admin.is_platform_admin,
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
