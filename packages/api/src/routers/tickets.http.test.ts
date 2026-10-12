import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { describe, expect, test } from "bun:test";

import { useTestDb } from "../testing/db";
import { appRouter } from "./index";

const { context } = useTestDb();
const handler = new OpenAPIHandler(appRouter);

async function request(method: string, path: string, payload?: unknown) {
  const { matched, response } = await handler.handle(
    new Request(`http://localhost${path}`, {
      method,
      headers: payload === undefined ? undefined : { "content-type": "application/json" },
      body: payload === undefined ? undefined : JSON.stringify(payload),
    }),
    { context },
  );
  if (!matched || !response) throw new Error(`No route for ${method} ${path}`);
  const body: any = await response.json();
  return { status: response.status, body };
}

describe("REST API", () => {
  test("POST /tickets creates a ticket (201)", async () => {
    const res = await request("POST", "/tickets", { title: "Printer on fire", priority: "high" });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ title: "Printer on fire", status: "open", priority: "high" });
    expect(new Date(res.body.createdAt).getTime()).not.toBeNaN();
  });

  test("POST /tickets rejects a missing title (400)", async () => {
    const res = await request("POST", "/tickets", { description: "no title" });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("BAD_REQUEST");
  });

  test("GET /tickets filters by status and paginates from the query string", async () => {
    for (const title of ["a", "b", "c"]) await request("POST", "/tickets", { title });
    await request("POST", "/tickets", { title: "done", status: "closed" });

    const res = await request("GET", "/tickets?status=open&page=2&limit=2");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.pagination).toEqual({ page: 2, limit: 2, total: 3, totalPages: 2 });
  });

  test("GET /tickets rejects an invalid status or limit (400)", async () => {
    expect((await request("GET", "/tickets?status=done")).status).toBe(400);
    expect((await request("GET", "/tickets?limit=500")).status).toBe(400);
  });

  test("PATCH /tickets/:id updates status (200), 404s on unknown id, 400s on empty body", async () => {
    const { body: created } = await request("POST", "/tickets", { title: "Bug" });

    const updated = await request("PATCH", `/tickets/${created.id}`, { status: "closed" });
    expect(updated.status).toBe(200);
    expect(updated.body).toMatchObject({ id: created.id, status: "closed" });

    const missing = await request("PATCH", `/tickets/${crypto.randomUUID()}`, { status: "closed" });
    expect(missing.status).toBe(404);

    expect((await request("PATCH", `/tickets/${created.id}`, {})).status).toBe(400);
  });

  test("GET /tickets/stats counts tickets by status", async () => {
    await request("POST", "/tickets", { title: "1" });
    await request("POST", "/tickets", { title: "2", status: "in_progress" });

    const res = await request("GET", "/tickets/stats");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ open: 1, in_progress: 1, closed: 0, total: 2 });
  });
});
