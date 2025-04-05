import type { OnPageTransitionEndAsync } from "vike/types";

export const onPageTransitionEnd: OnPageTransitionEndAsync = async () => {
  document
    .querySelector("#page-content")
    ?.classList.remove("page-is-transitioning");
};
