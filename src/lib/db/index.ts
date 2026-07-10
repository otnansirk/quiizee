import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL!;

const globalForDb = globalThis as unknown as {
  postgresClient: ReturnType<typeof postgres> | undefined;
};

const client = globalForDb.postgresClient ?? postgres(connectionString, {
  prepare: false,
  fetch_types: false,
  max: 3,
  idle_timeout: 5,
  connect_timeout: 10,
  max_lifetime: 60,
  onclose: function (connId) {
    // Suppress unhandled close errors
  },
});

// if (process.env.NODE_ENV !== 'production') {
  globalForDb.postgresClient = client;
// }

export const db = drizzle(client, { schema });
