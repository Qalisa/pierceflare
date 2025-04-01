import { PageContext } from "vike/types";

export default (pageContext: PageContext) => {
  const { store } = pageContext;
  const initialState = store.getState();
  pageContext.storeInitialState = initialState;
};
