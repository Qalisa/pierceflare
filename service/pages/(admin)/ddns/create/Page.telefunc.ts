import { flareDomains } from "@/db/schema";
import db from "@/db";

//
export const onSubmitDDNSEntry = async (
  ddnsForDomain: string,
  description: string,
) => {
  await db.insert(flareDomains).values({
    ddnsForDomain,
    description,
    createdAt: new Date(),
  });
  console.log("inserted");
};
