import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { count, eq } from "drizzle-orm";
import EventEmitter from "events";
import { z } from "zod";

import { produceRandomKey } from "#/helpers/random";

import { getDb } from ".";
import type { FlareSyncStatus } from "./schema";
import { flareDomains } from "./schema";
import { flares } from "./schema";
import { flareKeys } from "./schema";

/**
 * Represents an operation performed remotely.
 * - `"batch"`: Executes a batch of operations in a single request.
 * - `"dummy"`: A placeholder operation used for testing or no-op scenarios.
 */
export const RemoteOperation$ = z.enum(["batch", "dummy"]);
type RemoteOperation = z.infer<typeof RemoteOperation$>;

type FlareType = InferSelectModel<typeof flares>;
type DomainType = InferSelectModel<typeof flareDomains>;

//
export type DbRequestsEvents = {
  flareAdded: (FlareType & {
    remoteOperation: RemoteOperation;
  })[];
  flareSyncStatuted: FlareType["flareId"][];
  flareChanged: [
    flareId: FlareType["flareId"],
    status: FlareSyncStatus,
    dateEpoch: number,
  ][];
  domainChanged: DomainType["ddnsForDomain"][];
};

export const dbRequestsEE = new EventEmitter<DbRequestsEvents>();

//
//
//

export const eeRequests = {
  getCachedIPs: async (ddnsFullName: string) => {
    const [cachedIPs] = await getDb()
      .select({
        ipv4: flareDomains.latestSyncedIPv4,
        ipv6: flareDomains.latestSyncedIPv6,
        proxied: flareDomains.proxied,
      })
      .from(flareDomains)
      .where(eq(flareDomains.ddnsForDomain, ddnsFullName));
    return cachedIPs;
  },
  //
  queueFlareForProcessing: async (
    remoteOperation: RemoteOperation,
    toWrite: InferInsertModel<typeof flares>,
  ) => {
    //
    const [flare] = await getDb().insert(flares).values(toWrite).returning();

    //
    dbRequestsEE.emit("flareAdded", { ...flare, remoteOperation });
    dbRequestsEE.emit("flareChanged", [
      flare.flareId,
      "waiting",
      flare.receivedAt.getTime(),
    ]);
  },
  //
  markSyncStatusForFlare: async (
    flareId: FlareType["flareId"],
    {
      statusDescr,
      syncStatus,
      statusAt,
    }: Required<Pick<FlareType, "statusDescr" | "syncStatus" | "statusAt">>,
  ) => {
    //
    await getDb()
      .update(flares)
      .set({ statusAt, statusDescr, syncStatus })
      .where(eq(flares.flareId, flareId));

    //
    dbRequestsEE.emit("flareSyncStatuted", flareId);
    dbRequestsEE.emit("flareChanged", [
      flareId,
      syncStatus as FlareSyncStatus,
      statusAt!.getTime(),
    ]);
  },
  //
  mayUpdateFlareDomainSyncState: async ({
    flaredIPv4,
    flaredIPv6,
    ofDomain,
    statusAt,
  }: Pick<
    FlareType,
    "ofDomain" | "statusAt" | "flaredIPv4" | "flaredIPv6"
  >) => {
    //
    const [{ ipv4, ipv6 }] = await getDb()
      .select({
        ipv4: flareDomains.latestSyncedIPv4,
        ipv6: flareDomains.latestSyncedIPv6,
      })
      .from(flareDomains)
      .where(eq(flareDomains.ddnsForDomain, ofDomain));

    //
    if (ipv4 == flaredIPv4 && ipv6 == flaredIPv6) {
      return;
    }

    //
    await getDb()
      .update(flareDomains)
      .set({
        latestSyncedIPv4: flaredIPv4,
        latestSyncedIPv6: flaredIPv6,
        syncedIpAt: statusAt,
      })
      .where(eq(flareDomains.ddnsForDomain, ofDomain))
      .returning();

    //
    dbRequestsEE.emit("domainChanged", ofDomain);
  },
};

//
//
//

//
export const produceUnusedAPIKey = async () => {
  while (true) {
    //
    const key = produceRandomKey();
    //
    const [{ count: alreadyExist }] = await getDb()
      .select({ count: count() })
      .from(flareKeys)
      .where(eq(flareKeys.apiKey, key));

    if (alreadyExist) continue;

    //
    return key;
  }
};
