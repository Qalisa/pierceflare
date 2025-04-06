import { title } from "@/helpers/static";
import type Cloudflare from "cloudflare";

export type Zones = Awaited<ReturnType<typeof getZones>>;

//
export const getZones = async (cfCli: Cloudflare) => {
  console.log(`[${title}]`, "Checking availables zones...");
  const zones = await cfCli.zones.list({ status: "active" });
  if (zones.result.length == 0) {
    throw new Error(`[${title}] No zones are `);
  }

  //
  const zoneMap = zones.result.map(({ id, name }) => [id, name] as const);
  console.log(`[${title}]`, "Available zones :", zoneMap);

  return zoneMap;
};
