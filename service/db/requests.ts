import { produceRandomKey } from "@/helpers/random";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { count, eq } from "drizzle-orm";
import EventEmitter from "events";
import { getDb } from ".";
import type { FlareSyncStatus } from "./schema";
import { flares } from "./schema";
import { flareKeys } from "./schema";

/**
 * Represents an operation performed remotely.
 * - `"batch"`: Executes a batch of operations in a single request.
 * - `"dummy"`: A placeholder operation used for testing or no-op scenarios.
 */
type RemoteOperation = "batch" | "dummy";

type FlareType = InferSelectModel<typeof flares>;

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
};

export const dbRequestsEE = new EventEmitter<DbRequestsEvents>();

//
//
//

export const eeRequests = {
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
    { statusDescr, syncStatus }: Pick<FlareType, "statusDescr" | "syncStatus">,
  ) => {
    const statusAt = new Date();
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
      statusAt.getTime(),
    ]);
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
