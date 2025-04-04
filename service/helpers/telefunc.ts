import { Abort, getContext } from "telefunc";

//
export const onlyLoggedUser = () => {
  const { userLogged } = getContext();
  if (!userLogged) throw Abort();
};
