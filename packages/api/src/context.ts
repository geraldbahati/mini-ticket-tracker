import type { Session } from "@mini-ticket-tracker/auth";
import type { Database } from "@mini-ticket-tracker/db";

export type Context = {
  session: Session | null;
  db: Database;
};
