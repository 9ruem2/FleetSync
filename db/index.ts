import { drizzle } from 'drizzle-orm/netlify-db';
import * as schema from './schema';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let dbInstance: any;

export function getDb() {
  if (!dbInstance) {
    dbInstance = drizzle({ schema });
  }
  return dbInstance;
}
