import { flareDomains } from "@/db/schema";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const expectedInput$ = createInsertSchema(flareDomains)
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
