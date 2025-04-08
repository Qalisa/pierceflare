import type { CellContext } from "@tanstack/react-table";
import TimeAgo from "timeago-react";

//
export const timeAgoFormatter = <T,>({ getValue }: CellContext<T, unknown>) => {
  //
  let date = getValue();

  //
  if (date == null || date == undefined) {
    return <span className="text-base-content/50">{"[NO DATA]"}</span>;
  }

  //
  if (typeof date === "string") {
    date = new Date(date);
  }

  //
  if (date instanceof Date) {
    return <TimeAgo opts={{ minInterval: 5 }} datetime={date} />;
  }

  return <span className="text-error/75">{"[ERROR]"}</span>;
};
