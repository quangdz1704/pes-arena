# PES Arena — Implementation Plan

## Architecture decisions

- Next.js App Router with Server Components for reads, Server Actions for internal mutations, and Route Handlers for Discord and cron integrations.
- PostgreSQL is the source of truth, accessed through Drizzle ORM and the Neon serverless HTTP driver.
- Domain flow is `UI → Action/Route → Service → Repository → Drizzle → PostgreSQL`.
- Match data is normalized as `match → two sides → side players`; football team and score belong to a side.
- Statistics are derived from finished matches instead of mutable aggregate counters.
- All timestamps are stored in UTC and presented in `Asia/Ho_Chi_Minh`.

## Phase checklist

### Phase 1 — Foundation

- [x] Initialize Next.js, TypeScript strict mode, Tailwind CSS, and shadcn/ui.
- [x] Add the dark gaming shell and responsive navigation.
- [x] Define Drizzle schema, migration, database client, and seed data.
- [x] Build Players, Teams, and Team Pools management.
- [x] Verify schema invariants, tests, lint, typecheck, and build.

Phase 1 code checkpoint passed. Applying the migration and seed to a live database remains an environment step because no `DATABASE_URL` has been provided in the workspace.

### Phase 2 — Core Match

- [ ] Build 1v1 and 2v2 match creation.
- [ ] Add random players, pair shuffle, team pools, pure/balanced random, and rerolls.
- [ ] Add match start, mobile score entry, persistence, and history.

### Phase 3 — Statistics

- [ ] Add leaderboard ranges/modes and eligibility thresholds.
- [ ] Add profiles, H2H, pair stats, rivalry, streaks, and records.

### Phase 4 — Discord

- [ ] Add match embeds, troll captions, retry, preview, and manual reports.
- [ ] Add weekly awards, secured Vercel Cron, and idempotent reports.

### Phase 5 — Tournament

- [ ] Add 1v1/2v2 league competitors, round-robin fixtures, and standings.
- [ ] Add tournament history; defer knockout until the league flow is stable.

### Phase 6 — Polish

- [ ] Finish PWA, mobile/desktop polish, motion, accessibility, and performance.
- [ ] Run migrations, seed, full tests, lint, typecheck, and production build.

## Phase checkpoints

Every phase must finish with relevant tests, `npm run lint`, `npm run typecheck`, and `npm run build`. Database phases additionally require a migration and seed run against PostgreSQL.
