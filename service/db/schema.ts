import {
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";

export const flareDomains = sqliteTable("flare_domains", {
  ddnsForDomain: text().primaryKey(),
  createdAt: integer({ mode: "timestamp_ms" }).notNull(),
  description: text().notNull(),
  //
  syncedIpAt: integer({ mode: "timestamp_ms" }),
  latestSyncedIPv6: text(),
  latestSyncedIPv4: text(),
});
export const flareDomains$ = createInsertSchema(flareDomains);

export const flareKeys = sqliteTable("flare_keys", {
  apiKey: text().primaryKey(),
  ddnsForDomain: text()
    .references(() => flareDomains.ddnsForDomain, { onDelete: "cascade" })
    .notNull(),
  createdAt: integer({ mode: "timestamp_ms" }).notNull(),
});

export const flares = sqliteTable(
  "flares_send",
  {
    ofDomain: text()
      .references(() => flareDomains.ddnsForDomain)
      .notNull(),
    receivedAt: integer({ mode: "timestamp_ms" }).notNull(),
    flaredIPv4: text(),
    flaredIPv6: text(),
    syncStatus: text().notNull().default("waiting"),
    statusAt: integer({ mode: "timestamp_ms" }),
    statusDescr: text(),
  },
  (table) => [primaryKey({ columns: [table.receivedAt, table.ofDomain] })],
);
