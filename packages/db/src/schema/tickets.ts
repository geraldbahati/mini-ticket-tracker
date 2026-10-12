import { sql } from "drizzle-orm";
import { index, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

import { ticketPriority, ticketStatus } from "../ticket-enums";

export * from "../ticket-enums";

export const ticket = mysqlTable(
  "ticket",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    status: mysqlEnum("status", ticketStatus).default("open").notNull(),
    priority: mysqlEnum("priority", ticketPriority).default("medium").notNull(),
    // now() without a precision truncates to whole seconds.
    createdAt: timestamp("created_at", { fsp: 3 })
      .default(sql`(now(3))`)
      .notNull(),
    updatedAt: timestamp("updated_at", { fsp: 3 })
      .default(sql`(now(3))`)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("ticket_status_idx").on(table.status),
    index("ticket_created_at_idx").on(table.createdAt),
  ],
);

export type Ticket = typeof ticket.$inferSelect;
export type NewTicket = typeof ticket.$inferInsert;
