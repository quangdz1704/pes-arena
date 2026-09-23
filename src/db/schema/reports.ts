import {
  index,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import { discordReportStatusEnum, discordReportTypeEnum } from "./enums";

export const discordReports = pgTable(
  "discord_reports",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    type: discordReportTypeEnum("type").notNull(),
    periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
    periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),
    status: discordReportStatusEnum("status").default("PENDING").notNull(),
    errorMessage: text("error_message"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("discord_reports_period_unique").on(
      table.type,
      table.periodStart,
      table.periodEnd,
    ),
    index("discord_reports_status_idx").on(table.status),
  ],
);
