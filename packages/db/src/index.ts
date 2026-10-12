import { type MySql2Database, drizzle } from "drizzle-orm/mysql2";
import { type Pool, createPool } from "mysql2";

import type { DatabaseConfig } from "./config";
import { relations } from "./relations";

export type Database = MySql2Database<typeof relations> & { $client: Pool };

export function createDb(env: DatabaseConfig): Database {
  // Drizzle writes to `client.config`, which mysql2's PromisePool doesn't have, so give it the
  // callback pool and let drizzle wrap it.
  return drizzle({
    client: createPool({ uri: env.DATABASE_URL }),
    relations,
  });
}
