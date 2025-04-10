import type { getRootStore } from "@/store/index";
import { type RootState } from "@/store/reducers/index";
import type { PageContextInjection } from "@/server/types";

declare global {
  namespace Vike {
    type PageContext = PageContextInjection & {
      //
      store: ReturnType<typeof getRootStore>;
      storeInitialState: RootState;

      // Refine type of pageContext.Page (it's `unknown` by default)
      Page: () => React.JSX.Element;
      //
    };
  }
}

export {};
