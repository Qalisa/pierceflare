import { Abort, getContext } from "telefunc";

//
export const onlyLoggedUser = () => {
  const context = getContext();
  if (!context.userLogged) throw Abort();
  return context;
};
