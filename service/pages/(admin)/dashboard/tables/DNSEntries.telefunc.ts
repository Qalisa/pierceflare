import { onlyLoggedUser } from "@/helpers/telefunc";
import { getFlareDomains, hasAnyFlareDomains } from "./DNSEntries.queries";

//
export const onGettingFlareDomains = async () => {
  onlyLoggedUser();
  return getFlareDomains();
};

//
export const onHasAnyFlareDomains = async () => {
  onlyLoggedUser();
  return hasAnyFlareDomains();
};
