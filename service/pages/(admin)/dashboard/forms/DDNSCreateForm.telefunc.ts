import { flareDomains } from "@/db/schema";
import db from "@/db";
import { withLinger } from "@/helpers/withLinger";
import { SQLiteError } from "bun:sqlite";
import { Abort } from "telefunc";
import { onlyLoggedUser } from "@/helpers/telefunc";

export const onSubmitDDNSEntry = (
  ...args: Parameters<typeof _onSubmitDDNSEntry>
) => withLinger(_onSubmitDDNSEntry(...args));

//
const _onSubmitDDNSEntry = async (
  subdomain: string,
  cloudFlareDomain: string,
  description: string,
) => {
  //
  const { availableCloudflareDomains } = onlyLoggedUser();

  //
  if (!availableCloudflareDomains.includes(cloudFlareDomain)) {
    throw Abort(`Chosen "${cloudFlareDomain}" domain is not allowed`);
  }

  //
  if (subdomain.includes(".")) {
    throw Abort(`Subdomain "${subdomain}" should not contain "."`);
  }

  //
  await db
    .insert(flareDomains)
    .values({
      ddnsForDomain: `${subdomain}.${cloudFlareDomain}`,
      description,
      createdAt: new Date(),
    })
    .catch((e) => {
      if (e instanceof SQLiteError) {
        throw Abort(e.message);
      }
    });
};
