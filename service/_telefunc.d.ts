import "telefunc";
import type { PageContextInjection } from "./helpers/types.js";

declare module "telefunc" {
  namespace Telefunc {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface Context extends PageContextInjection {}
  }
}

export {};
