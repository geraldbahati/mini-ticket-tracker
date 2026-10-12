import type { Database } from "@mini-ticket-tracker/db";
import { ticket, ticketStatus } from "@mini-ticket-tracker/db/schema/tickets";
import { ORPCError } from "@orpc/server";
import { count, desc, eq } from "drizzle-orm";

import type {
  CreateTicketInput,
  ListTicketsInput,
  ListTicketsOutput,
  TicketStats,
  UpdateTicketInput,
} from "../schemas/ticket";

async function findTicketOrThrow(db: Database, id: string) {
  const [row] = await db.select().from(ticket).where(eq(ticket.id, id)).limit(1);
  if (!row) {
    throw new ORPCError("NOT_FOUND", { message: `Ticket ${id} not found` });
  }
  return row;
}

export async function createTicket(db: Database, input: CreateTicketInput) {
  const id = crypto.randomUUID();
  await db.insert(ticket).values({ id, ...input });
  return findTicketOrThrow(db, id);
}

export async function listTickets(
  db: Database,
  { status, page, limit }: ListTicketsInput,
): Promise<ListTicketsOutput> {
  const where = status ? eq(ticket.status, status) : undefined;

  const [data, [totals]] = await Promise.all([
    db
      .select()
      .from(ticket)
      .where(where)
      .orderBy(desc(ticket.createdAt), desc(ticket.id))
      .limit(limit)
      .offset((page - 1) * limit),
    db.select({ total: count() }).from(ticket).where(where),
  ]);

  const total = totals?.total ?? 0;
  return {
    data,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function updateTicket(db: Database, { id, ...patch }: UpdateTicketInput) {
  await findTicketOrThrow(db, id);
  await db.update(ticket).set(patch).where(eq(ticket.id, id));
  return findTicketOrThrow(db, id);
}

export async function getTicketStats(db: Database): Promise<TicketStats> {
  const rows = await db
    .select({ status: ticket.status, count: count() })
    .from(ticket)
    .groupBy(ticket.status);

  const stats: TicketStats = { open: 0, in_progress: 0, closed: 0, total: 0 };
  for (const status of ticketStatus) {
    stats[status] = rows.find((row) => row.status === status)?.count ?? 0;
  }
  stats.total = stats.open + stats.in_progress + stats.closed;
  return stats;
}
