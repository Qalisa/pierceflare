import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/solid";
import type { CellContext } from "@tanstack/react-table";

//
export const ipAddressFormatter = <T,>(type: "IPv4" | "IPv6") => {
  //
  const i = ({ getValue }: CellContext<T, unknown>) => {
    //
    const ip = getValue() as string | null;

    //
    if (ip == null || ip == undefined) {
      return (
        <span className="text-base-content/25">
          {type == "IPv4"
            ? "[255.255.255.255]"
            : "[ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff]"}
        </span>
      );
    }

    return (
      <a
        className="group flex items-center justify-start gap-2"
        href={"http://" + ip}
        target="_blank"
        rel="noreferrer"
      >
        <span className="underline group-hover:font-bold">{ip}</span>
        <ArrowTopRightOnSquareIcon className="size-3" />
      </a>
    );
  };

  return i;
};
