import { getCloudflareContext } from '@opennextjs/cloudflare';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

declare global {
  // eslint-disable-next-line no-var
  var __quiizee_pg_client__: postgres.Sql | undefined;
}

type DbInstance = ReturnType<typeof drizzle<typeof schema>>;

let cachedDb: DbInstance | null = null;
let cachedConnectionString: string | null = null;

export function getDb(): DbInstance {
  let connectionString = process.env.DATABASE_URL;
  try {
    const { env } = getCloudflareContext();
    if (env && env.HYPERDRIVE) {
      try {
        const hyperdriveStr = env.HYPERDRIVE.connectionString;
        if (hyperdriveStr) {
          connectionString = hyperdriveStr;
        }
      } catch {
        // Fallback to process.env.DATABASE_URL during local dev / static build
      }
    }
  } catch {
    // Not running in Cloudflare context or during initial build
  }

  if (!connectionString) {
    throw new Error('DATABASE_URL or HYPERDRIVE connection string is not defined');
  }

  let finalConnectionString = connectionString;
  if (
    typeof finalConnectionString === 'string' &&
    finalConnectionString.includes('supabase.com') &&
    !finalConnectionString.includes('pgbouncer=true')
  ) {
    try {
      const urlObj = new URL(finalConnectionString);
      if (urlObj.port === '5432') {
        urlObj.port = '6543';
      }
      urlObj.searchParams.set('pgbouncer', 'true');
      finalConnectionString = urlObj.toString();
    } catch {
      // Ignore URL parse error
    }
  }

  // Reuse cached database client within this Cloudflare Worker isolate if the connection string matches
  if (cachedDb && cachedConnectionString === finalConnectionString) {
    return cachedDb;
  }

  // If connection string changed or old client exists in globalThis, clean it up
  if (globalThis.__quiizee_pg_client__) {
    try {
      globalThis.__quiizee_pg_client__.end({ timeout: 1 });
    } catch {
      // Ignore cleanup errors
    }
  }

  const client = postgres(finalConnectionString, {
    prepare: false,
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
    fetch_types: false,
  });

  globalThis.__quiizee_pg_client__ = client;
  cachedConnectionString = finalConnectionString;
  cachedDb = drizzle(client, { schema });

  return cachedDb;
}
