import { drizzle as drizzlePg } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let dbInstance: any;

export function getDb() {
  if (!dbInstance) {
    const connectionString =
      process.env.DATABASE_URL ||
      process.env.SUPABASE_DATABASE_URL ||
      process.env.POSTGRES_URL;

    if (!connectionString) {
      throw new Error(
        'Database connection string not found. Please define DATABASE_URL or SUPABASE_DATABASE_URL in .env'
      );
    }

    // Connect to Supabase / PostgreSQL via postgres driver
    const client = postgres(connectionString, { prepare: false });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dbInstance = (drizzlePg as any)({ client, schema });
  }
  return dbInstance;
}

