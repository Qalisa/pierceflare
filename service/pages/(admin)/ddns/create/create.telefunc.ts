import { flareDomains, flareDomains$ } from "@/db/schema";
import { z } from "zod";
import db from "@/db";

//
export const createDDNSEntry = (values: z.infer<typeof flareDomains$>) => {
  values.createdAt = new Date();
  db.insert(flareDomains).values(values);
};
