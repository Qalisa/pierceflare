import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type { JSX } from "react";
import { useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useTRPC } from "@/helpers/trpc";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSubscription, type inferOutput } from "@trpc/tanstack-react-query";
import ReloadButton from "@/components/ReloadButton";
import WebSocketIndicator from "@/components/WebSocketIndicator";
import { timeAgoFormatter } from "@/components/TimeAgoCellFormater";

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
  const { data: flares } = useQuery(trpc.getFlares.queryOptions({ limit: 5 }));
  const { status, data: wsData } = useSubscription(
    trpc.onFlaresUpdates.subscriptionOptions(),
  );

  //
  useEffect(() => {
    if (wsData) invalidateFlares();
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
    columnHelper.accessor("receivedAt", {
      header: "",
      cell: timeAgoFormatter,
    }),
    columnHelper.accessor("ofDomain", {
      header: "Domain",
    }),
    columnHelper.group({
      header: "IPs",
      columns: [
        columnHelper.accessor("flaredIPv4", {
          header: "v4",
        }),
        columnHelper.accessor("flaredIPv6", {
          header: "v6",
        }),
      ],
    }),
    columnHelper.group({
      header: "Sync",
      columns: [
        columnHelper.accessor("syncStatus", {
          header: "Status",
        }),
        columnHelper.accessor("statusAt", {
          header: "At",
          cell: timeAgoFormatter,
        }),
        columnHelper.accessor("statusDescr", {
          header: "Descr",
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
    getCoreRowModel: getCoreRowModel(),
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
    <div className="mb-8 w-11/12">
      <div className="mx-4 flex items-end gap-4">
        <WebSocketIndicator status={status} />
        <ReloadButton
          className="ml-auto"
          action={invalidateFlares}
          disabled={useSkeleton}
        />
        {belt}
      </div>
      <div className="divider"></div>
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
            <AnimatePresence initial={false} mode="popLayout">
              {table.getRowModel().rows.map((row) => {
                //
                const key = row.original.flareId;

                //
                return (
                  <TR key={key}>
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </TR>
                );
              })}
            </AnimatePresence>
          )}
        </tbody>
      </table>
    </div>
  );
};

//
const TR = ({ children }: { children: React.ReactNode }) => {
  return (
    <motion.tr
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {children}
    </motion.tr>
  );
};

export default FlaresTable;
