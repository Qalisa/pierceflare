import { flareDomains$ } from "@/db/schema";
import { z } from "zod";

export const expectedInput$ = flareDomains$
  .omit({
    createdAt: true,
    syncedIpAt: true,
    latestSyncedIp: true,
    ddnsForDomain: true,
  })
  .merge(
    z.object({
      cloudFlareDomain: z.string(),
      subdomain: z.string(),
    }),
  );
