import { flareDomains$ } from "@/db/schema";

export const expectedInput = flareDomains$.omit({
  createdAt: true,
  syncedIpAt: true,
  latestSyncedIp: true,
});
