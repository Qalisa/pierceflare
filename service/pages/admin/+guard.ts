import { routes } from "@/server/app";
import { redirect } from "vike/abort";
import { PageContext } from "vike/types";

export const guard = (pageContext: PageContext) => {
  const user = pageContext;
  if (user === null) {
    throw redirect(routes.pages.login);
  }
};
