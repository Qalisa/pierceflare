import { flareDomains } from "@/db/schema";
import db from "@/db";
import { SERVICE_CLOUDFLARE_AVAILABLE_DOMAINS } from "@/server/env";
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
  onlyLoggedUser();

  //
  if (!SERVICE_CLOUDFLARE_AVAILABLE_DOMAINS.includes(cloudFlareDomain)) {
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
