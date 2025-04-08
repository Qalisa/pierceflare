import { getRootStore } from "@/store";
import type { PageContext } from "vike/types";

export default (pageContext: PageContext) => {
  pageContext.store = getRootStore({});
};
