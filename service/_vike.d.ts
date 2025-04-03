import { getRootStore } from "@/store/index";
import { type RootState } from "@/store/reducers/index";
import { AppUser } from "./server/app";

type SessionDataTypes = {
  user?: AppUser;
  authFailure?: { username?: string; message: string };
};

type InjectingPageContext = SessionDataTypes & {
  k8sApp: {
    imageVersion: string;
    imageRevision: string;
    version: string;
  };
};

type PageContextInjection = {
  injected: InjectingPageContext;
};

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

export { type PageContextInjection, type SessionDataTypes };
