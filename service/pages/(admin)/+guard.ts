import { routes } from "@/helpers/routes";
import { redirect } from "vike/abort";
import type { PageContext } from "vike/types";

export const guard = (pageContext: PageContext) => {
  const { injected } = pageContext;
  const { user } = injected;
  if (!user) {
    throw redirect(routes.pages.login);
  }
};
