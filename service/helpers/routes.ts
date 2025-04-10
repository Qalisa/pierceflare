const loginPageRoute = "/";

const apiRoot = "/api";

/** ALL URL Routes / paths handled by the app */
const routes = {
  /** page specific routes */
  pages: {
    login: loginPageRoute,
    dashboard: "/dashboard",
    flaresFeed: "/feed",
  },
  /** API specific routes */
  appApi: {
    logout: "/logout",
  },
  trpc: {
    root: "/trpc",
  },
  api: {
    root: apiRoot,
    flare: `${apiRoot}/flare`,
    infos: `${apiRoot}/infos`,
  },
  /** default route to redirect, most probably root url, aka "/" */
  default: loginPageRoute,
} as const;

// If you define Vike.PageContext in a .d.ts file then
// make sure there is at least one export/import statement.
// Tell TypeScript this file isn't an ambient module:
export { routes };
