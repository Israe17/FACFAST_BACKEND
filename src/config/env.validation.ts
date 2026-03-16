type Environment = Record<string, string | undefined>;

function assert_required(value: string | undefined, key: string): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}

export function validate_env(env: Environment): Environment {
  assert_required(env.JWT_ACCESS_SECRET, 'JWT_ACCESS_SECRET');
  assert_required(env.JWT_REFRESH_SECRET, 'JWT_REFRESH_SECRET');
  assert_required(env.FIELD_ENCRYPTION_KEY, 'FIELD_ENCRYPTION_KEY');

  const has_database_url = Boolean(env.DATABASE_URL);

  if (env.DB_USE_PG_MEM !== 'true' && !has_database_url) {
    assert_required(env.DB_HOST, 'DB_HOST');
    assert_required(env.DB_PORT, 'DB_PORT');
    assert_required(env.DB_USERNAME, 'DB_USERNAME');
    assert_required(env.DB_PASSWORD, 'DB_PASSWORD');
    assert_required(env.DB_NAME, 'DB_NAME');
  }

  return env;
}
