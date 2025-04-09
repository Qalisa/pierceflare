import { produceRandomKey } from "@/helpers/random";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { count, eq } from "drizzle-orm";
import EventEmitter from "events";
import { getDb } from ".";
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
  flareChanged: FlareType["flareId"][];
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
    dbRequestsEE.emit("flareChanged", flare.flareId);
  },
  //
  markSyncStatusForFlare: async (
    flareId: FlareType["flareId"],
    { statusDescr, syncStatus }: Pick<FlareType, "statusDescr" | "syncStatus">,
  ) => {
    //
    await getDb()
      .update(flares)
      .set({ statusAt: new Date(), statusDescr, syncStatus })
      .where(eq(flares.flareId, flareId));

    //
    dbRequestsEE.emit("flareSyncStatuted", flareId);
    dbRequestsEE.emit("flareChanged", flareId);
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
