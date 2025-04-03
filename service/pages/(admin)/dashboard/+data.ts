export { data };

import { type PageContext } from "vike/types";
import db from "@/db";
import { flareDomains } from "@/db/schema";

const data = async (_pageContext: PageContext) => {
  const domains = await db.select().from(flareDomains);
  return { domains };
};
