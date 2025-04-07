import type { CellContext } from "@tanstack/react-table";

//
export const dateFormatter = <OfDomain>({
  getValue,
}: CellContext<OfDomain, unknown>) => {
  let date = getValue();

  if (date == null || date == undefined) {
    return "[NO DATA]";
  }

  //
  if (typeof date === "string") {
    date = new Date(date);
  }

  //
  if (date instanceof Date) {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  return "[ERROR]";
};
