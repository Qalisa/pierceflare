import db from "@/db";
import { flareDomains } from "@/db/schema";
import { count } from "drizzle-orm";

export const onGettingFlareDomains = async () => db.select().from(flareDomains);
export const onHasAnyFlareDomains = async () =>
  db.select({ count: count() }).from(flareDomains);
