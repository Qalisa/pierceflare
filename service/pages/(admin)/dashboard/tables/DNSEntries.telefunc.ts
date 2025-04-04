import db from "@/db";
import { flareDomains } from "@/db/schema";
import { onlyLoggedUser } from "@/helpers/telefunc";
import { count } from "drizzle-orm";

export const onGettingFlareDomains = async () => {
  onlyLoggedUser();
  return db.select().from(flareDomains);
};
export const onHasAnyFlareDomains = async () => {
  onlyLoggedUser();
  return db.select({ count: count() }).from(flareDomains);
};
