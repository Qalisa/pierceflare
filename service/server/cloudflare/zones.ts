import type Cloudflare from "cloudflare";

import logr from "#/server/helpers/loggers";

export type Zones = Awaited<ReturnType<typeof getZones>>;

//
export const getZones = async (cfCli: Cloudflare) => {
  logr.log("Checking availables zones...");
  const zones = await cfCli.zones.list({ status: "active" });
  if (zones.result.length == 0) {
    const issue =
      "No zones are allowed for supplied CloudFlare API Key. Please update its permissions.";

    //
    logr.error(issue);
    throw new Error(issue);
  }

  //
  const zoneMap = zones.result.map(({ id, name }) => [id, name] as const);
  logr.log("Available zones :", zoneMap);

  return zoneMap;
};
