import { getRootStore } from "@/store";
import { PageContext } from "vike/types";

export default (pageContext: PageContext) => {
  pageContext.store = getRootStore({});
};
