import { getCloudflareContext } from '@opennextjs/cloudflare';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export function getDb() {
  let connectionString = process.env.DATABASE_URL;
  try {
    const { env } = getCloudflareContext();
    if (env && (env as any).HYPERDRIVE) {
      try {
        const hyperdriveStr = (env as any).HYPERDRIVE.connectionString;
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

  const client = postgres(finalConnectionString, {
    prepare: false,
    max: 1,
  });

  return drizzle(client, { schema });
}
