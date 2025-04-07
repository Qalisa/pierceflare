import type { RowSelectionState } from "@tanstack/react-table";
import { KeyIcon, PlusCircleIcon } from "@heroicons/react/24/solid";

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { dateFormatter } from "@/helpers/table";
import { useMemo } from "react";
import { getModal, modalIds } from "@/helpers/modals";
import { useDispatch, useSelector } from "react-redux";
import {
  defineSelected,
  defineSelectedAsToBeDeleted,
  manageAPIKeyOf,
} from "@/store/reducers/ddnsEntries";
import type { RootState } from "@/store/reducers";
import { AnimatePresence, motion } from "motion/react";
import ReloadButton from "@/components/ReloadButton";
import { useTRPC } from "@/helpers/trpc";
import { useQuery } from "@tanstack/react-query";
import type { inferOutput } from "@trpc/tanstack-react-query";

//
const DNSEntriesTable = () => {
  const trpc = useTRPC();
  const { data: domains } = useQuery(trpc.getFlareDomains.queryOptions());
  type OfDomains = inferOutput<typeof trpc.getFlareDomains>[number];

  const dispatch = useDispatch();

  // Get selected domains from Redux store
  const selectedDomains = useSelector(
    (state: RootState) => state.ddnsEntries.selected,
  );

  // Convert selectedDomains to rowSelection format required by tanstack/react-table
  const rowSelection = useMemo(() => {
    if (!domains || !selectedDomains || selectedDomains.length === 0) return {};

    const selection: RowSelectionState = {};
    domains.forEach((domain, index) => {
      if (selectedDomains.includes(domain.ddnsForDomain)) {
        selection[index] = true;
      }
    });
    return selection;
  }, [domains, selectedDomains]);

  const columnHelper = createColumnHelper<OfDomains>();

  const columns = [
    columnHelper.display({
      id: "select",
      header: ({ table }) => (
        <input
          type="checkbox"
          className="checkbox checkbox-sm"
          checked={table.getIsAllRowsSelected()}
          onChange={table.getToggleAllRowsSelectedHandler()}
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          className="checkbox checkbox-sm"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
        />
      ),
    }),
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
    columnHelper.display({
      id: "createKey",
      header: "", // Empty header for action column
      cell: ({ row }) => (
        <button
          className="btn btn-xs"
          onClick={() => {
            dispatch(manageAPIKeyOf(row.original.ddnsForDomain));
            getModal(modalIds.manageAPIKeys).openModal();
          }}
        >
          Generate API Key
          <KeyIcon className="size-3" />
        </button>
      ),
    }),
  ];

  const table = useReactTable({
    data: domains || [],
    columns,
    state: {
      rowSelection,
    },
    enableRowSelection: true,
    onRowSelectionChange: (updater) => {
      // Create a new selection state based on the updater
      let newSelection: RowSelectionState;

      // Handle both function updater and direct object assignment
      if (typeof updater === "function") {
        newSelection = updater(rowSelection);
      } else {
        newSelection = updater;
      }

      // Convert the selection state to an array of domain names
      const selectedIds = Object.entries(newSelection)
        .filter(([_, isSelected]) => isSelected)
        .map(([index, _]) => domains![parseInt(index)].ddnsForDomain);

      dispatch(defineSelected(selectedIds));
    },
    getCoreRowModel: getCoreRowModel(),
  });

  // Get the count of selected rows
  const selectedCount = selectedDomains?.length || 0;

  return (
    <div className="w-11/12">
      <div className="mx-4 flex gap-4">
        <button
          onClick={() => getModal(modalIds.createDDNS).openModal()}
          className="btn btn-primary btn-sm"
        >
          <PlusCircleIcon className="size-4" />
          Create DDNS Entry
        </button>

        {selectedCount > 0 && (
          <button
            onClick={() => {
              dispatch(defineSelectedAsToBeDeleted());
              getModal(modalIds.deleteDDNS).openModal();
            }}
            className="btn btn-outline btn-error btn-sm"
          >
            Delete Selected ({selectedCount})
          </button>
        )}
        <ReloadButton />
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
            <AnimatePresence>
              {table.getRowModel().rows.map((row) => (
                <motion.tr
                  key={row.id}
                  className={row.getIsSelected() ? "bg-base-200" : undefined}
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
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DNSEntriesTable;
