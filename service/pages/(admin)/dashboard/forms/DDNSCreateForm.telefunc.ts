import { flareDomains } from "@/db/schema";
import db from "@/db";
import { SERVICE_CLOUDFLARE_AVAILABLE_DOMAINS } from "@/server/env";
import { withLinger } from "@/helpers/withLinger";
import { SQLiteError } from "bun:sqlite";
import { Abort, getContext } from "telefunc";

export const onSubmitDDNSEntry = (
  ...args: Parameters<typeof _onSubmitDDNSEntry>
) => withLinger(_onSubmitDDNSEntry(...args));

//
const _onSubmitDDNSEntry = async (
  subdomain: string,
  cloudFlareDomain: string,
  description: string,
) => {
  const {
    injected: { user },
  } = getContext();

  // Only admins are allowed to run this telefunction
  if (!user) throw Abort();

  //
  if (!SERVICE_CLOUDFLARE_AVAILABLE_DOMAINS.includes(cloudFlareDomain)) {
    throw new Error(`Chosen "${cloudFlareDomain}" domain is not allowed`);
  }

  //
  if (subdomain.includes(".")) {
    throw new Error(`Subdomain "${subdomain}" should not contain "."`);
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
        console.log(e);
        throw new Error(e.message);
      }
    });
};
