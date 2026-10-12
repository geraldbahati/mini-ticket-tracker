import "varlock/auto-load";

import { ENV } from "./env";
import { createDb } from "./index";
import { type NewTicket, ticket, ticketPriority, ticketStatus } from "./schema/tickets";

if (ENV.NODE_ENV === "production") {
  console.error("Refusing to seed: NODE_ENV is production.");
  process.exit(1);
}

const titles = [
  "Login page returns 500 on wrong password",
  "Add dark mode toggle to settings",
  "Password reset email never arrives",
  "Export tickets as CSV",
  "Dashboard loads slowly with 1k+ tickets",
  "Typo on the pricing page",
  "Upgrade to React 19",
  "Mobile nav overlaps the logo",
  "Add keyboard shortcuts for ticket actions",
  "Session expires too quickly",
  "Search ignores accented characters",
  "Broken link in onboarding email",
  "Allow attaching screenshots to tickets",
  "Date picker shows wrong timezone",
  "Rate-limit the public API",
  "Audit log for status changes",
  "404 when opening a deleted ticket",
  "Improve empty state copy",
  "Sort tickets by priority",
  "Avatar upload fails for PNGs over 2MB",
  "Add Slack notifications for high priority tickets",
  "Stats cards flicker on refresh",
  "Validate title length on the client",
  "Pagination resets after editing a ticket",
  "Document the REST endpoints",
  "Footer links point to staging",
  "Bulk-close stale tickets",
  "Dropdowns are not keyboard accessible",
  "Remember the last status filter",
  "Add a health check for the database",
];

const DAY = 24 * 60 * 60 * 1000;
const now = Date.now();
const rows: NewTicket[] = titles.map((title, i) => ({
  title,
  description: i % 3 === 0 ? null : `Reported via seed data (#${i + 1}).`,
  status: ticketStatus[i % ticketStatus.length],
  // Without the i / 3 offset, status and priority would always line up.
  priority: ticketPriority[(i + Math.floor(i / 3)) % ticketPriority.length],
  createdAt: new Date(now - (titles.length - i) * DAY),
}));

const db = createDb(ENV);
try {
  await db.delete(ticket);
  await db.insert(ticket).values(rows);
  console.log(`Seeded ${rows.length} tickets.`);
} finally {
  await db.$client.end();
}
