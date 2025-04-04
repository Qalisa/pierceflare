import { flareDomains } from "@/db/schema";
import db from "@/db";
import { SERVICE_CLOUDFLARE_AVAILABLE_DOMAINS } from "@/server/env";

//
export const onSubmitDDNSEntry = async (
  subdomain: string,
  cloudFlareDomain: string,
  description: string,
) => {
  //
  if (!SERVICE_CLOUDFLARE_AVAILABLE_DOMAINS.includes(cloudFlareDomain)) {
    throw new Error(`Chosen "${cloudFlareDomain}" domain is not allowed`);
  }

  //
  await db.insert(flareDomains).values({
    ddnsForDomain: `${subdomain}.${cloudFlareDomain}`,
    description,
    createdAt: new Date(),
  });
};
