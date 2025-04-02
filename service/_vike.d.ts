import { getRootStore } from "@/store/index";
import { type RootState } from "@/store/reducers/index";

declare global {
  namespace Vike {
    interface PageContext {
      authFailureMessages: Express.session.SessionData["messages"];

      //
      store: ReturnType<typeof getRootStore>;
      storeInitialState: RootState;
      //
      k8sApp: {
        imageVersion: string;
        imageRevision: string;
        version: string;
      };
      // Refine type of pageContext.Page (it's `unknown` by default)
      Page: () => React.JSX.Element;
      //
    }
  }
}

export {};
