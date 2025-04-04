import type { CellContext } from "@tanstack/react-table";

//
export const dateFormatter = <OfDomain>({
  getValue,
}: CellContext<OfDomain, unknown>) => {
  const date = getValue();
  if (date instanceof Date) {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
  return "NO DATA";
};
