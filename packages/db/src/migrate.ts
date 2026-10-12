import { migrate } from "drizzle-orm/mysql2/migrator";
import { fileURLToPath } from "node:url";

import type { Database } from "./index";

const migrationsFolder = fileURLToPath(new URL("./migrations", import.meta.url));

export async function runMigrations(db: Database) {
  await migrate(db, { migrationsFolder });
}
