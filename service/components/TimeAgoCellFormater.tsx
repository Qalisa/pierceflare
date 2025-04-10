import TimeAgo from "timeago-react";

import { CalendarIcon, ClockIcon } from "@heroicons/react/24/solid";
import type { CellContext } from "@tanstack/react-table";

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
    return (
      <label className="swap text-xs">
        <input type="checkbox" />
        <div className="swap-on flex items-center gap-2">
          <CalendarIcon className="size-3" />
          {date.toLocaleString()}
        </div>
        <div className="swap-off flex items-center gap-2">
          <ClockIcon className="size-3" />
          <TimeAgo opts={{ minInterval: 5 }} datetime={date} />
        </div>
      </label>
    );
  }

  return <span className="text-error/75">{"[ERROR]"}</span>;
};
