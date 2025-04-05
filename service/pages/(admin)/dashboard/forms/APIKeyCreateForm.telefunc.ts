import { flareKeys } from "@/db/schema";
import db from "@/db";
import { withLinger } from "@/helpers/withLinger";
import { Abort } from "telefunc";
import { onlyLoggedUser } from "@/helpers/telefunc";
import { count, eq } from "drizzle-orm";
import { produceRandomKey } from "@/helpers/random";

//
//
//

const produceUnusedAPIKey = async () => {
  while (true) {
    //
    const key = produceRandomKey();
    //
    const [{ count: alreadyExist }] = await db
      .select({ count: count() })
      .from(flareKeys)
      .where(eq(flareKeys.apiKey, key));

    if (alreadyExist) continue;

    //
    return key;
  }
};

//
//
//

export const onSubmitAPIKeyCreation = (
  ...args: Parameters<typeof _onSubmitAPIKeyCreation>
) => withLinger(_onSubmitAPIKeyCreation(...args));

//
const _onSubmitAPIKeyCreation = async (ddnsForDomain: string) => {
  //
  onlyLoggedUser();

  //
  if (ddnsForDomain == null) {
    throw Abort("Domain is required");
  }

  //
  const apiKey = await produceUnusedAPIKey();

  //
  await db
    .insert(flareKeys)
    .values({
      ddnsForDomain,
      apiKey,
      createdAt: new Date(),
    })
    .catch((e) => {
      throw Abort(e.message);
    });

  //
  return apiKey;
};
