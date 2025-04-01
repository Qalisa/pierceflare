import { getRootStore } from "@/store";
import { PageContext } from "vike/types";

// store is initialized only once on the client, so it can persist between client-side navigations
let store: ReturnType<typeof getRootStore> | null = null;

export default (pageContext: PageContext) => {
  // If we use Client Routing, then we should initialize the store only once
  // (See https://vike.dev/server-routing-vs-client-routing for more information about Client Routing and Server Routing.)
  if (!store) {
    const { storeInitialState } = pageContext;
    store = getRootStore(storeInitialState);
  }

  pageContext.store = store;
};
