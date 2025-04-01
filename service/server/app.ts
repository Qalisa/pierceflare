const loginPageRoute = "/";

/** ALL URL Routes / paths handled by the app */
const routes = {
  /** page specific routes */
  pages: {
    login: loginPageRoute,
    dashboard: "/dashboard",
  },
  /** API specific routes */
  api: {},
  /** default route to redirect, most probably root url, aka "/" */
  default: loginPageRoute,
} as const;

interface AppUser {
  username: string;
}

type AppAdminUser = AppUser;

declare global {
  // Overriding Express.User with our own baked User type (required by Express API https://stackoverflow.com/a/40762463/3021058)
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface User extends AppUser {}
    namespace session {
      interface Session {
        messages?: string[];
      }
    }
  }
}

// If you define Vike.PageContext in a .d.ts file then
// make sure there is at least one export/import statement.
// Tell TypeScript this file isn't an ambient module:
export { routes };
export type { AppUser, AppAdminUser };
