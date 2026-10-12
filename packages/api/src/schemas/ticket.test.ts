import { describe, expect, test } from "bun:test";

import { createTicketInput, listTicketsInput, updateTicketInput } from "./ticket";

describe("createTicketInput", () => {
  test("applies status and priority defaults", () => {
    expect(createTicketInput.parse({ title: "Printer jammed" })).toEqual({
      title: "Printer jammed",
      status: "open",
      priority: "medium",
    });
  });

  test("trims the title and rejects a blank one", () => {
    expect(createTicketInput.parse({ title: "  Fix login  " }).title).toBe("Fix login");
    expect(createTicketInput.safeParse({ title: "   " }).success).toBe(false);
    expect(createTicketInput.safeParse({}).success).toBe(false);
  });

  test("rejects unknown enum values", () => {
    expect(createTicketInput.safeParse({ title: "x", status: "done" }).success).toBe(false);
    expect(createTicketInput.safeParse({ title: "x", priority: "urgent" }).success).toBe(false);
  });

  test("rejects a title over 255 characters", () => {
    expect(createTicketInput.safeParse({ title: "a".repeat(256) }).success).toBe(false);
  });
});

describe("listTicketsInput", () => {
  test("defaults to page 1, limit 20", () => {
    expect(listTicketsInput.parse({})).toEqual({ page: 1, limit: 20 });
  });

  test("coerces query-string numbers", () => {
    expect(listTicketsInput.parse({ page: "3", limit: "5", status: "closed" })).toEqual({
      page: 3,
      limit: 5,
      status: "closed",
    });
  });

  test("enforces page and limit bounds", () => {
    expect(listTicketsInput.safeParse({ page: 0 }).success).toBe(false);
    expect(listTicketsInput.safeParse({ limit: 0 }).success).toBe(false);
    expect(listTicketsInput.safeParse({ limit: 101 }).success).toBe(false);
    expect(listTicketsInput.safeParse({ page: "abc" }).success).toBe(false);
  });
});

describe("updateTicketInput", () => {
  const id = crypto.randomUUID();

  test("accepts status, priority, or both", () => {
    expect(updateTicketInput.safeParse({ id, status: "closed" }).success).toBe(true);
    expect(updateTicketInput.safeParse({ id, priority: "high" }).success).toBe(true);
    expect(updateTicketInput.safeParse({ id, status: "open", priority: "low" }).success).toBe(true);
  });

  test("rejects an empty patch", () => {
    expect(updateTicketInput.safeParse({ id }).success).toBe(false);
  });

  test("rejects a non-uuid id", () => {
    expect(updateTicketInput.safeParse({ id: "123", status: "closed" }).success).toBe(false);
  });
});
