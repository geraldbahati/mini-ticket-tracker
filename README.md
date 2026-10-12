# Mini Ticket Tracker

A small support-ticket tracker: a REST API (Express + oRPC), a MySQL database (Drizzle ORM) and a
single-page React UI to list, filter, create and update tickets.

## Quick start

**Prerequisites:** [Bun](https://bun.sh) 1.3+ and Docker. Ports 3000 (API), 3001 (web) and
3307 (MySQL) must be free.

```bash
bun install

# Environment (defaults work with the Docker database below)
cp apps/server/.env.example apps/server/.env
cp apps/web/.env.example apps/web/.env

# Database: MySQL 8.4 in Docker on host port 3307, then schema + 30 sample tickets
bun run db:start
bun run db:push
bun run db:seed

# API on http://localhost:3000, web app on http://localhost:3001
bun run dev
```

Open **http://localhost:3001/tickets**. Interactive API docs are at **http://localhost:3000/docs**
(OpenAPI spec at `/docs/spec.json`).

Stop the database with `bun run db:stop` (or `bun run db:down` to remove the container; data stays
in a Docker volume). If you already run MySQL on 3307, set `MYSQL_PORT` and update `DATABASE_URL`.

## API

All endpoints are public and accept/return JSON.

| Method  | Path             | Description                                                                 |
| ------- | ---------------- | --------------------------------------------------------------------------- |
| `POST`  | `/tickets`       | Create a ticket → `201`                                                     |
| `GET`   | `/tickets`       | List tickets, newest first. `?status=`, `?page=` (default 1), `?limit=` (default 20, max 100) |
| `PATCH` | `/tickets/:id`   | Update `status` and/or `priority` → `404` if the id is unknown              |
| `GET`   | `/tickets/stats` | Count of tickets grouped by status                                          |

Invalid input returns `400` with the validation issues.

```bash
curl -X POST localhost:3000/tickets -H 'content-type: application/json' \
  -d '{"title":"Login broken","description":"500 on submit","priority":"high"}'
# 201 {"id":"293334a1-…","title":"Login broken","description":"500 on submit",
#      "status":"open","priority":"high","createdAt":"…","updatedAt":"…"}

curl 'localhost:3000/tickets?status=open&page=2&limit=5'
# {"data":[…],"pagination":{"page":2,"limit":5,"total":11,"totalPages":3}}

curl -X PATCH localhost:3000/tickets/<id> -H 'content-type: application/json' \
  -d '{"status":"closed"}'

curl localhost:3000/tickets/stats
# {"open":10,"in_progress":10,"closed":10,"total":30}
```

### Ticket model

| Field         | Type      | Notes                                                |
| ------------- | --------- | ---------------------------------------------------- |
| `id`          | UUID      | Primary key, generated on create                     |
| `title`       | string    | Required, 1–255 chars (trimmed)                      |
| `description` | string    | Optional, up to 5000 chars                           |
| `status`      | enum      | `open` \| `in_progress` \| `closed` (default `open`) |
| `priority`    | enum      | `low` \| `medium` \| `high` (default `medium`)       |
| `createdAt`   | timestamp | Set by the database on creation                      |
| `updatedAt`   | timestamp | Updated on every change                              |

## Tests

```bash
bun run db:start   # tests use a separate mini_ticket_tracker_test database in the same container
bun run test
```

- `schemas/ticket.test.ts`: validation rules (no database needed)
- `routers/tickets.test.ts`: each procedure against MySQL (create, filter, pagination, update, 404, stats)
- `routers/tickets.http.test.ts`: real HTTP requests through the REST handler (paths, query strings, `201`/`400`/`404`)

The tests apply the committed migrations and empty the `ticket` table before each test. Set
`TEST_DATABASE_URL` to use another database. After changing the schema, run
`bun run db:generate` so the tests get the new migration.

## Decisions & Tradeoffs

I started from the Better-T-Stack generator (Express, oRPC, Drizzle with MySQL, React) so my time
went into the tickets feature rather than setup. It also brought auth and a monorepo layout this
task doesn't need... I left those alone. Each endpoint is written once as an oRPC procedure, which
serves the REST routes from the spec and gives the React app a typed client, so the same Zod rules
check both the API and the create form. Ticket ids are UUIDs generated before the insert, because
MySQL has no `RETURNING` to give back the new row. Pagination is offset-based since the spec asks
for `?page=&limit=`. That's fine at this size, but deep pages get slow, and with real data I'd
switch to cursor pagination and a `(status, created_at)` index. After an update the UI just
refetches the list and the stats... the server decides which tickets match a filter, so I didn't
want the client guessing. Tests run against a real MySQL in Docker, not mocks, since most of the
logic is SQL. I skipped auth on the ticket endpoints and UI tests, and `PATCH` has no conflict
check, so if two people edit the same ticket the last save wins. Next I'd add auth with assignees.

**Assumptions**

- Endpoints are public: the spec doesn't mention users.
- New tickets default to `open` / `medium`. Status and priority may also be set on create.
- `PATCH` only changes `status` and/or `priority` and must include at least one of them.
- Pages are 1-based. A page past the end returns `200` with an empty list (the client has
  `total` / `totalPages`).
- Stats always include all three statuses (zeros included) plus a `total`.

## Project structure

```
apps/
  server/   Express app: mounts the REST handler, the RPC handler (/rpc) and auth
  web/      React + TanStack Router/Query UI (src/routes/tickets.tsx, src/components/tickets/)
packages/
  api/      Ticket schemas (Zod), service (queries) and router (endpoints) + tests
  db/       Drizzle schema, migrations, seed script, Docker Compose
  ui/       Shared shadcn/ui components
  auth/     Better-Auth config (from the scaffold; not used by tickets)
```

Request flow: `router (validation) → service (Drizzle query) → MySQL`. The web app calls the same
procedures over `/rpc`, so request and response types are checked at compile time.

## Scripts

| Script | Description |
| --- | --- |
| `bun run dev` | Start the API and web app |
| `bun run test` | Run the test suite (needs `db:start`) |
| `bun run check-types` | Type-check all packages |
| `bun run build` | Build all apps |
| `bun run db:start` / `db:stop` / `db:down` | Manage the Docker MySQL container |
| `bun run db:push` | Apply the schema to the database |
| `bun run db:generate` | Generate a migration after a schema change |
| `bun run db:seed` | Replace all tickets with 30 sample tickets (refuses to run in production) |
| `bun run db:studio` | Open Drizzle Studio |

Environment variables are validated at startup by [Varlock](https://varlock.dev) against each
app's `.env.schema`.
