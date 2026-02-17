import { sql } from "drizzle-orm";
import { pgPolicy, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const quotes = pgTable(
  "quotes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").notNull(),
    title: text("title").notNull(),
    status: text("status", {
      enum: ["draft", "ready", "sent", "accepted", "declined"],
    })
      .notNull()
      .default("draft"),
    createdById: text("created_by_id").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    pgPolicy("org_isolation", {
      for: "all",
      using: sql`${table.organizationId} = current_setting('app.current_org_id', true)::uuid`,
      withCheck: sql`${table.organizationId} = current_setting('app.current_org_id', true)::uuid`,
    }),
  ],
);
