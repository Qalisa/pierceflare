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
  //
  availableCloudflareDomains: string[];
};

export type PageContextInjection = {
  injected: InjectingPageContext;
};
