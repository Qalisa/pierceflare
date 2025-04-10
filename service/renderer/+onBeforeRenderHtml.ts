import type { PageContext } from "vike/types";

import { getRootStore } from "#/store";

export default (pageContext: PageContext) => {
  pageContext.store = getRootStore({});
};
