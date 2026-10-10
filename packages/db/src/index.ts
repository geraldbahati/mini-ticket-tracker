import { drizzle } from "drizzle-orm/mysql2";

import type { DatabaseConfig } from "./config";
import { relations } from "./relations";

export function createDb(env: DatabaseConfig) {
  return drizzle({
    connection: {
      uri: env.DATABASE_URL,
    },
    relations,
  });
}

export type Database = ReturnType<typeof createDb>;
