export interface AppUser {
  username: string;
}

//
//
//

export type SessionDataTypes = {
  user?: AppUser;
  authFailure?: { username?: string; message: string };
};

//
//
//

type InjectingPageContext = SessionDataTypes & {
  k8sApp: {
    imageVersion: string;
    imageRevision: string;
    version: string;
  };
  availableCloudflareDomains: string[];
};

export type PageContextInjection = {
  injected: InjectingPageContext;
};
