import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema/index.ts",
  out: "./src/db/migrations",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      "postgresql://postgres:postgres@localhost:5432/pes_arena",
  },
  migrations: {
    table: "__drizzle_migrations__",
    schema: "public",
  },
  strict: true,
  verbose: true,
});
