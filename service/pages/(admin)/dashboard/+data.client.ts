export { data, type DataType };

import { type PageContext } from "vike/types";
import {
  onGettingFlareDomains,
  onHasAnyFlareDomains,
} from "./tables/DNSEntries.telefunc";

const data = async (_pageContext: PageContext) => {
  //
  const [{ count }] = await onHasAnyFlareDomains();
  if (count == 0) return { noEntries: true };

  //
  const domains = await onGettingFlareDomains();
  return { domains };
};

type DataType = Awaited<ReturnType<typeof data>>;
