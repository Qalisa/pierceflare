import { useData } from "vike-react/useData";
import { type DataType } from "./+data.shared";
import type { ColumnDef, CellContext } from "@tanstack/react-table";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import { openModal } from "./modals/CreateDDNSEntry";

//
type OfDomain = DataType["domains"] extends undefined
  ? never
  : NonNullable<DataType["domains"]>[number];

//
const dateFormatter = ({ getValue }: CellContext<OfDomain, unknown>) => {
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

const columns: ColumnDef<OfDomain>[] = [
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: dateFormatter,
  },
  { accessorKey: "ddnsForDomain", header: "Domain" },
  { accessorKey: "description", header: "Description" },
  { accessorKey: "latestSyncedIp", header: "IP" },
  { accessorKey: "syncedIpAt", header: "Latest Update", cell: dateFormatter },
];

//
const DNSEntriesTable = () => {
  //
  const { domains } = useData<DataType>();

  const table = useReactTable({
    data: domains!,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  //
  return (
    <>
      <button className="btn" onClick={openModal}>
        Create
      </button>
      <table className="table-xs table">
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
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
};

//
//
//

export default DNSEntriesTable;
