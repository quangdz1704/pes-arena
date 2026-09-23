# Architecture

## Source layout

```text
src/
  app/          routes, layouts, loading/error boundaries, server actions
  components/   shared UI and domain presentation components
  db/           Drizzle client, schema, migrations, and seed
  lib/          framework and shared utilities
  repositories/ server-only persistence queries
  services/     domain validation and orchestration
```

## Match model

```text
matches
  ├── match_sides (A)
  │     └── match_side_players (1 player in 1v1, 2 players in 2v2)
  └── match_sides (B)
        └── match_side_players (1 player in 1v1, 2 players in 2v2)
```

`match_side_players.match_id` is intentionally denormalized so PostgreSQL can enforce `unique(match_id, player_id)`. A composite foreign key ensures the referenced side belongs to the same match. Exactly two sides and mode-specific player counts are service-layer invariants validated inside the match transaction.

## Data access

Only `src/db`, `src/repositories`, and server-side services can import the database client. These modules use `server-only`. Server Components receive small DTOs, while Server Actions validate every untrusted input with Zod before calling a service.
