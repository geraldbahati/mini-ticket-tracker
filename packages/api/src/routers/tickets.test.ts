import { ticket } from "@mini-ticket-tracker/db/schema/tickets";
import { call, ORPCError } from "@orpc/server";
import { beforeEach, describe, expect, test } from "bun:test";

import { useTestDb } from "../testing/db";
import { ticketsRouter } from "./tickets";

const { db, context } = useTestDb();

async function seed(rows: (typeof ticket.$inferInsert)[]) {
  await db.insert(ticket).values(rows);
}

const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000);

describe("POST /tickets (create)", () => {
  test("creates a ticket with defaults", async () => {
    const created = await call(ticketsRouter.create, { title: "Login page 500s" }, { context });

    expect(created.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(created).toMatchObject({
      title: "Login page 500s",
      description: null,
      status: "open",
      priority: "medium",
    });
    expect(created.createdAt).toBeInstanceOf(Date);
  });

  test("stores description, status and priority", async () => {
    const created = await call(
      ticketsRouter.create,
      { title: "Dark mode", description: "Add a toggle", status: "in_progress", priority: "low" },
      { context },
    );
    expect(created).toMatchObject({
      description: "Add a toggle",
      status: "in_progress",
      priority: "low",
    });
  });

  test("rejects invalid input", async () => {
    await expect(call(ticketsRouter.create, { title: "" }, { context })).rejects.toThrow();
  });
});

describe("GET /tickets (list)", () => {
  beforeEach(async () => {
    await seed([
      { title: "A", status: "open", createdAt: minutesAgo(5) },
      { title: "B", status: "closed", createdAt: minutesAgo(4) },
      { title: "C", status: "open", createdAt: minutesAgo(3) },
      { title: "D", status: "in_progress", createdAt: minutesAgo(2) },
      { title: "E", status: "open", createdAt: minutesAgo(1) },
    ]);
  });

  test("returns newest first with pagination meta", async () => {
    const result = await call(ticketsRouter.list, {}, { context });
    expect(result.data.map((t) => t.title)).toEqual(["E", "D", "C", "B", "A"]);
    expect(result.pagination).toEqual({ page: 1, limit: 20, total: 5, totalPages: 1 });
  });

  test("filters by status", async () => {
    const result = await call(ticketsRouter.list, { status: "open" }, { context });
    expect(result.data.map((t) => t.title)).toEqual(["E", "C", "A"]);
    expect(result.pagination.total).toBe(3);
  });

  test("paginates", async () => {
    const page2 = await call(ticketsRouter.list, { page: 2, limit: 2 }, { context });
    expect(page2.data.map((t) => t.title)).toEqual(["C", "B"]);
    expect(page2.pagination).toEqual({ page: 2, limit: 2, total: 5, totalPages: 3 });
  });

  test("combines status filter and pagination", async () => {
    const result = await call(ticketsRouter.list, { status: "open", page: 2, limit: 2 }, { context });
    expect(result.data.map((t) => t.title)).toEqual(["A"]);
    expect(result.pagination).toEqual({ page: 2, limit: 2, total: 3, totalPages: 2 });
  });

  test("returns an empty page past the end", async () => {
    const result = await call(ticketsRouter.list, { page: 10, limit: 2 }, { context });
    expect(result.data).toEqual([]);
    expect(result.pagination.total).toBe(5);
  });
});

describe("PATCH /tickets/:id (update)", () => {
  test("updates status", async () => {
    const created = await call(ticketsRouter.create, { title: "Bug" }, { context });
    const updated = await call(
      ticketsRouter.update,
      { id: created.id, status: "closed" },
      { context },
    );
    expect(updated).toMatchObject({ id: created.id, status: "closed", priority: "medium" });
  });

  test("updates priority", async () => {
    const created = await call(ticketsRouter.create, { title: "Bug" }, { context });
    const updated = await call(
      ticketsRouter.update,
      { id: created.id, priority: "high" },
      { context },
    );
    expect(updated).toMatchObject({ status: "open", priority: "high" });
  });

  test("returns NOT_FOUND for an unknown id", async () => {
    const error = await call(
      ticketsRouter.update,
      { id: crypto.randomUUID(), status: "closed" },
      { context },
    ).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ORPCError);
    expect(error).toMatchObject({ code: "NOT_FOUND" });
  });
});

describe("GET /tickets/stats", () => {
  test("returns zeros when there are no tickets", async () => {
    expect(await call(ticketsRouter.stats, undefined, { context })).toEqual({
      open: 0,
      in_progress: 0,
      closed: 0,
      total: 0,
    });
  });

  test("counts tickets by status", async () => {
    await seed([
      { title: "1", status: "open" },
      { title: "2", status: "open" },
      { title: "3", status: "closed" },
    ]);
    expect(await call(ticketsRouter.stats, undefined, { context })).toEqual({
      open: 2,
      in_progress: 0,
      closed: 1,
      total: 3,
    });
  });
});
