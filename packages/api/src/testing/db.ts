import { createDb } from "@mini-ticket-tracker/db";
import { runMigrations } from "@mini-ticket-tracker/db/migrate";
import { ticket } from "@mini-ticket-tracker/db/schema/tickets";
import { afterAll, beforeAll, beforeEach } from "bun:test";

import type { Context } from "../context";

// Needs the Docker MySQL from `bun run db:start`.
export function useTestDb() {
  const db = createDb({
    DATABASE_URL:
      process.env.TEST_DATABASE_URL ??
      "mysql://root:password@localhost:3307/mini_ticket_tracker_test",
  });
  const context: Context = { db, session: null };

  beforeAll(async () => {
    await runMigrations(db);
  });

  beforeEach(async () => {
    await db.delete(ticket);
  });

  afterAll(async () => {
    await db.$client.end();
  });

  return { db, context };
}
