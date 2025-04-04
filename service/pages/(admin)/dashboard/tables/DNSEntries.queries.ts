import db from "@/db";
import { flareDomains } from "@/db/schema";
import { count } from "drizzle-orm";

//
export const getFlareDomains = async () => await db.select().from(flareDomains);
//
export const hasAnyFlareDomains = async () =>
  await db.select({ count: count() }).from(flareDomains);
