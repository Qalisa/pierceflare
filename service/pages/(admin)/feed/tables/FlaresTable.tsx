import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type { JSX } from "react";
import { Fragment, useCallback, useEffect } from "react";
import { motion } from "motion/react";
import { useTRPC } from "@/helpers/trpc";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSubscription, type inferOutput } from "@trpc/tanstack-react-query";
import ReloadButton from "@/components/ReloadButton";
import WebSocketIndicator from "@/components/WebSocketIndicator";
import { timeAgoFormatter } from "@/components/TimeAgoCellFormater";
import type { RootState } from "@/store/reducers";
import { resetUnseenCount } from "@/store/reducers/unseenUpdates";
import { useDispatch, useSelector } from "react-redux";
import type { FlareSyncStatus } from "@/db/schema";
import { ChevronUpIcon, ChevronDownIcon } from "@heroicons/react/24/solid";
import { ipAddressFormatter } from "@/components/IPCellFormater";
import { domainNameFormatter } from "@/components/DomainCellFormater";

//
//
//

//
const FlaresTable = ({
  belt,
  noData,
}: {
  noData: JSX.Element;
  belt?: JSX.Element;
}) => {
  //
  //
  //

  //
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  //
  const invalidateFlares = useCallback(
    () =>
      queryClient.invalidateQueries({
        queryKey: trpc.getFlares.queryKey(),
      }),
    [queryClient, trpc],
  );

  //
  const { data: flares } = useQuery(trpc.getFlares.queryOptions({ limit: 20 }));
  const { status, data: wsData } = useSubscription(
    trpc.onFlaresUpdates.subscriptionOptions(),
  );

  const dispatch = useDispatch();
  const flaresUpdates = useSelector(
    (state: RootState) => state.unseenUpdates.unseenUpdates.flares,
  );

  //
  useEffect(() => {
    if (flaresUpdates) {
      dispatch(resetUnseenCount("flares"));
      invalidateFlares();
    }
  }, []);

  //
  useEffect(() => {
    if (!wsData) return;
    invalidateFlares();
  }, [wsData]);

  const useSkeleton = flares == undefined;
  const data = useSkeleton ? Array(10).fill({}) : flares;
  const noFlares = flares && flares.length == 0;

  //
  //
  //

  type OfFlares = inferOutput<typeof trpc.getFlares>[number];
  const columnHelper = createColumnHelper<OfFlares>();
  const columns = [
    columnHelper.group({
      id: "infos",
      header: () => <WebSocketIndicator status={status} />,
      columns: [
        columnHelper.accessor("receivedAt", {
          cell: timeAgoFormatter,
        }),
        columnHelper.accessor("ofDomain", {
          header: "Domain",
          cell: domainNameFormatter,
        }),
      ],
    }),
    columnHelper.group({
      header: "IPs",
      columns: [
        columnHelper.accessor("flaredIPv4", {
          header: "v4",
          cell: ipAddressFormatter("IPv4"),
        }),
        columnHelper.accessor("flaredIPv6", {
          header: "v6",
          cell: ipAddressFormatter("IPv6"),
        }),
      ],
    }),
    columnHelper.group({
      header: "Sync",
      columns: [
        columnHelper.accessor("syncStatus", {
          header: "Status",
          cell: (c) => {
            //
            const value = c.getValue() as FlareSyncStatus;

            //
            const className = (() => {
              switch (value) {
                case "waiting":
                  return "status-warning";
                case "error":
                  return "status-error";
                case "ok":
                  return "status-success";
              }
            })();

            //
            return (
              <div className="flex items-center gap-2">
                <div className="inline-grid *:[grid-area:1/1]">
                  {value == "waiting" && (
                    <div className={`status ${className} animate-ping`}></div>
                  )}
                  <div className={`status ${className}`}></div>
                </div>
                <span className="text-xs">{value}</span>
              </div>
            );
          },
        }),
        columnHelper.accessor("statusAt", {
          header: "At",
          cell: timeAgoFormatter,
        }),
        columnHelper.display({
          id: "collapser",
          header: "",
          cell: ({ row }) => {
            //
            if (!row.getCanExpand()) return <></>;

            const expanded = row.getIsExpanded();

            //
            return (
              <button
                className={`swap ${expanded ? "swap-active" : ""}`}
                onClick={row.getToggleExpandedHandler()}
              >
                <ChevronUpIcon className="swap-on size-4" />
                <ChevronDownIcon className="swap-off size-4" />
              </button>
            );
          },
        }),
      ],
    }),
  ];

  //
  //
  //

  const table = useReactTable({
    data,
    columns,
    getRowCanExpand: (row) => row.original.statusDescr != null,
    getRowId: (originalRow, i) =>
      originalRow.flareId
        ? originalRow.flareId.toString()
        : "skel_" + i.toString(),
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),

    enableSorting: false,
  });

  //
  const produceSkeletonRows = () =>
    table.getRowModel().rows.map((row) => (
      <tr key={row.id}>
        {row.getAllCells().map((cell) => (
          <td key={cell.id}>
            {cell.column.accessorFn ? (
              <div className="skeleton h-4 w-20"></div>
            ) : (
              flexRender(cell.column.columnDef.cell, cell.getContext())
            )}
          </td>
        ))}
      </tr>
    ));

  //
  //
  //

  //
  return (
    <div className="mb-32 w-11/12">
      <div className="mx-4 flex items-end gap-4">
        <ReloadButton
          className="ml-auto"
          action={invalidateFlares}
          disabled={useSkeleton}
        />
        {belt}
      </div>
      <div className="divider"></div>
      <div className="overflow-x-auto">
        <table className="table w-full">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    colSpan={header.colSpan}
                    className={
                      header.column.getCanSort()
                        ? "cursor-pointer select-none"
                        : ""
                    }
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {useSkeleton ? (
              produceSkeletonRows()
            ) : noFlares ? (
              <tr>
                <td colSpan={99}>{noData}</td>
              </tr>
            ) : (
              <>
                {table.getRowModel().rows.map((row) => {
                  //
                  const expanded = row.getIsExpanded();
                  const className =
                    row.original.syncStatus ==
                    ("error" satisfies FlareSyncStatus)
                      ? [
                          expanded ? "bg-error/50" : "bg-error/25",
                          "text-error-content",
                        ].join(" ")
                      : "";

                  //
                  return (
                    <Fragment key={row.id}>
                      <TR className={className}>
                        {row.getVisibleCells().map((cell) => {
                          //
                          return (
                            <td key={cell.id}>
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext(),
                              )}
                            </td>
                          );
                        })}
                      </TR>
                      {expanded &&
                        (() => {
                          return (
                            <TR className={className}>
                              <td colSpan={row.getVisibleCells().length}>
                                <div className="flex w-full gap-4">
                                  <strong>Message:</strong>
                                  <code className="bg-neutral flex-1 p-4 text-xs">
                                    {row.original.statusDescr}
                                  </code>
                                </div>
                              </td>
                            </TR>
                          );
                        })()}
                    </Fragment>
                  );
                })}
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

//
const TR = ({
  children,
  className,
}: {
  className: string;
  children: React.ReactNode;
}) => {
  return (
    <motion.tr
      layout
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.tr>
  );
};

export default FlaresTable;
