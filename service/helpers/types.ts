export interface AppUser {
  username: string;
}

//
//
//

/** do not store sensitive data */
export type SessionDataTypes = {
  user?: AppUser;
  encryptedSessionData?: string;
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
  availableCloudflareDomains: string[];
  //
  tRPCWsUrl: string;
};

export type PageContextInjection = {
  injected: InjectingPageContext;
};
