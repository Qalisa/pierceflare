import { redirect } from "vike/abort";
import type { PageContext } from "vike/types";

import { routes } from "#/server/helpers/routes";

export const guard = (pageContext: PageContext) => {
  const { injected } = pageContext;
  const { user } = injected;
  if (!user) {
    throw redirect(routes.pages.login);
  }
};
