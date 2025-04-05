import "telefunc";

declare module "telefunc" {
  namespace Telefunc {
    interface Context {
      userLogged?: true;
      availableCloudflareDomains: string[];
    }
  }
}

export {};
