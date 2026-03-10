import { DataSource, DataSourceOptions } from 'typeorm';
import { DataType, newDb } from 'pg-mem';

export async function create_data_source(
  options?: DataSourceOptions,
): Promise<DataSource> {
  if (process.env.DB_USE_PG_MEM === 'true') {
    const database = newDb({
      autoCreateForeignKeyIndices: true,
    });

    database.public.registerFunction({
      name: 'current_database',
      returns: DataType.text,
      implementation: () => 'pg_mem',
    });
    database.public.registerFunction({
      name: 'version',
      returns: DataType.text,
      implementation: () => 'pg-mem',
    });
    database.public.registerFunction({
      name: 'now',
      returns: DataType.timestamptz,
      implementation: () => new Date(),
    });

    const adapters = database.adapters;
    const data_source = adapters.createTypeormDataSource({
      ...(options ?? {}),
      type: 'postgres',
    }) as DataSource;
    return data_source.initialize();
  }

  if (!options) {
    throw new Error('Missing datasource options.');
  }

  const data_source = new DataSource(options);
  return data_source.initialize();
}
