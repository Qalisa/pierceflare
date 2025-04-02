import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const flares = sqliteTable("flares", {
  ddnsForDomain: text("domain").primaryKey(),
  description: text("description"),
});
