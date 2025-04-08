import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { dateFormatter } from "@/helpers/table";
import type { JSX } from "react";
import { useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useTRPC } from "@/helpers/trpc";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSubscription, type inferOutput } from "@trpc/tanstack-react-query";
import ReloadButton from "@/components/ReloadButton";
import WebSocketIndicator from "@/components/WebSocketIndicator";

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
  const { data: flares } = useQuery(trpc.getFlares.queryOptions());
  const { status, data: wsData } = useSubscription(
    trpc.onFlaresUpdates.subscriptionOptions(),
  );

  //
  useEffect(() => {
    invalidateFlares();
  }, [wsData]);

  const useSkeleton = flares == undefined;
  const data = useSkeleton ? Array(10).fill({}) : flares;
  const noFlares = flares && flares.length == 0;

  //
  //
  //

  type OfDomains = inferOutput<typeof trpc.getFlareDomains>[number];
  const columnHelper = createColumnHelper<OfDomains>();
  const columns = [
    columnHelper.accessor("createdAt", {
      header: "Created At",
      cell: dateFormatter,
    }),
    columnHelper.accessor("ddnsForDomain", {
      header: "Domain",
    }),
    columnHelper.accessor("description", {
      header: "Description",
    }),
    columnHelper.group({
      header: "IPs",
      columns: [
        columnHelper.accessor("latestSyncedIPv4", {
          header: "v4",
        }),
        columnHelper.accessor("latestSyncedIPv6", {
          header: "v6",
        }),
      ],
    }),
    columnHelper.accessor("syncedIpAt", {
      header: "Latest Update",
      cell: dateFormatter,
    }),
  ];

  //
  //
  //

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
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
    <div className="w-11/12">
      <div className="mx-4 flex items-end gap-4">
        <WebSocketIndicator status={status} />
        <ReloadButton className="ml-auto" action={invalidateFlares} />
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
              <AnimatePresence>
                {table.getRowModel().rows.map((row) => {
                  return (
                    <motion.tr
                      key={row.id}
                      className={
                        row.getIsSelected() ? "bg-base-200" : undefined
                      }
                      initial={{ opacity: 1 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      layout
                      transition={{ duration: 0.6 }}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </td>
                      ))}
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FlaresTable;
