import { useData } from "vike-react/useData";
import { type DataType } from "../+data";
import type { RowSelectionState } from "@tanstack/react-table";
import { ArrowPathIcon, PlusCircleIcon } from "@heroicons/react/24/solid";
import { reload } from "vike/client/router";

import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import { dateFormatter } from "@/helpers/table";
import { useState, useEffect } from "react";
import { getModal, modalIds } from "@/helpers/modals";
import { useDispatch } from "react-redux";
import {
  defineSelected,
  defineSelectedAsToBeDeleted,
} from "@/store/reducers/ddnsEntries";

type OfDomain = DataType["domains"] extends undefined
  ? never
  : NonNullable<DataType["domains"]>[number];

const DNSEntriesTable = () => {
  const { domains } = useData<DataType>();
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const columnHelper = createColumnHelper<OfDomain>();
  const dispatch = useDispatch();

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
    columnHelper.accessor("latestSyncedIp", {
      header: "IP",
    }),
    columnHelper.accessor("syncedIpAt", {
      header: "Latest Update",
      cell: dateFormatter,
    }),
  ];

  const table = useReactTable({
    data: domains || [],
    columns,
    state: {
      rowSelection,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
  });

  useEffect(() => {
    const selectedIds = Object.keys(rowSelection).map(
      (index) => domains![parseInt(index)].ddnsForDomain,
    );
    dispatch(defineSelected(selectedIds));
    //
  }, [rowSelection]);

  // Get the count of selected rows
  const selectedCount = Object.keys(rowSelection).length;

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
        <button onClick={reload} className="btn btn-sm ml-auto">
          <ArrowPathIcon className="size-4" />
          Reload
        </button>
      </div>
      <div className="divider"></div>
      <div className="overflow-x-auto">
        <table className="table-zebra table w-full">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id}>
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className={row.getIsSelected() ? "bg-base-200" : undefined}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DNSEntriesTable;
