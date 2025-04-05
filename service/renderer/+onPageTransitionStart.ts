import type { OnPageTransitionStartAsync } from "vike/types";

export const onPageTransitionStart: OnPageTransitionStartAsync = async () => {
  document
    .querySelector("#page-content")
    ?.classList.add("page-is-transitioning");
};
