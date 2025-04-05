import { flareDomains, flareKeys } from "@/db/schema";
import db from "@/db";
import { withLinger } from "@/helpers/withLinger";
import { SQLiteError } from "bun:sqlite";
import { Abort } from "telefunc";
import { onlyLoggedUser } from "@/helpers/telefunc";
import { inArray } from "drizzle-orm";

export const onSubmitDeleteDDNSEntries = (
  ...args: Parameters<typeof _onSubmitDeleteDDNSEntries>
) => withLinger(_onSubmitDeleteDDNSEntries(...args));

//
const _onSubmitDeleteDDNSEntries = async (subdomains: string[]) => {
  //
  onlyLoggedUser();

  //
  await db
    .delete(flareDomains)
    .where(inArray(flareDomains.ddnsForDomain, subdomains))
    .catch((e) => {
      if (e instanceof SQLiteError) {
        throw Abort(e.message);
      }
    });

  // TODO: make cascading delete work and remove below
  await db
    .delete(flareKeys)
    .where(inArray(flareKeys.ddnsForDomain, subdomains))
    .catch((e) => {
      if (e instanceof SQLiteError) {
        throw Abort(e.message);
      }
    });
};
