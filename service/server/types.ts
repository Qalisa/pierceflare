export interface AppUser {
  username: string;
}

//
//
//

/** do not store sensitive data */
export type SessionDataTypes = {
  user?: AppUser;
  authFailure?: { username?: string; message: string };
};

//
//
//

type InjectingPageContext = SessionDataTypes & {
  //
  k8sApp: {
    imageVersion: string;
    imageRevision: string;
    version: string;
  };
  //
  trpcUrl: string;
  cloudflare: {
    workerState: "disabled" | "starting" | "running";
    availableDomains: string[];
  };
};

export type PageContextInjection = {
  injected: InjectingPageContext;
};
