import { getCloudflareContext } from '@opennextjs/cloudflare';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export function getDb() {
  const { env } = getCloudflareContext();
  const connectionString = env.HYPERDRIVE.connectionString;

  console.log('[DB] connectionString host check:', connectionString.split('@')[1]?.split('/')[0]);

  const client = postgres(connectionString, {
    prepare: false,
    max: 1,
    connect_timeout: 5,
    idle_timeout: 5,
  });

  return drizzle(client, { schema });
}
