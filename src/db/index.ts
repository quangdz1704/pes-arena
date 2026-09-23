import "server-only";

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "./schema";

export class DatabaseNotConfiguredError extends Error {
  constructor() {
    super("DATABASE_URL chưa được cấu hình.");
    this.name = "DatabaseNotConfiguredError";
  }
}

function createDatabase() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new DatabaseNotConfiguredError();
  }

  const sql = neon(databaseUrl);
  return drizzle(sql, { schema });
}

let database: ReturnType<typeof createDatabase> | null = null;

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

export function getDb() {
  database ??= createDatabase();
  return database;
}

export type Database = ReturnType<typeof getDb>;
