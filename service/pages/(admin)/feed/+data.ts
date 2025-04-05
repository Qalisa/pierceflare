import type { PageContext } from "vike/types";
import { getApiKeys, getFlares } from "./Page.queries";

export const data = async (_pageContext: PageContext) => {
  //
  const apiKeys = await getApiKeys();
  const flares = await getFlares();
  return { apiKeys, flares };
};

export type DataType = Awaited<ReturnType<typeof data>>;
