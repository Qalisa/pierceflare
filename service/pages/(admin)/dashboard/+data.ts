import { type PageContext } from "vike/types";
import {
  getFlareDomains,
  hasAnyFlareDomains,
} from "./tables/DNSEntries.queries";

//
export const data = async (_pageContext: PageContext) => {
  //
  const [{ count }] = await hasAnyFlareDomains();
  if (count == 0) return { noEntries: true };

  //
  const domains = await getFlareDomains();
  return { domains };
};
