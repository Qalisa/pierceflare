import { flareDomains$ } from "@/db/schema";
import { z } from "zod";

export const expectedInput$ = flareDomains$
  .omit({
    createdAt: true,
    syncedIpAt: true,
    latestSyncedIPv4: true,
    latestSyncedIPv6: true,
    ddnsForDomain: true,
  })
  .merge(
    z.object({
      cloudFlareDomain: z.string(),
      subdomain: z.string(),
    }),
  );
