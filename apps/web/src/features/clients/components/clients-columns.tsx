import type { ColumnDef } from "@tanstack/react-table";

import type { Client } from "@acme/zen-v3/zenstack/models";
import { Badge } from "@acme/ui/badge";
import { Checkbox } from "@acme/ui/checkbox";

import { DataTableColumnHeader } from "~/components/data-table";
import { DataTableRowActions } from "./data-table-row-actions";

export const clientsColumns: ColumnDef<Client>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Nome" />
    ),
    meta: { className: "ps-1", tdClassName: "ps-4" },
    cell: ({ row }) => {
      return (
        <span className="max-w-32 truncate font-medium sm:max-w-72 md:max-w-[31rem]">
          {row.getValue("name")}
        </span>
      );
    },
  },
  {
    accessorKey: "email",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
    meta: { className: "ps-1", tdClassName: "ps-4" },
    cell: ({ row }) => {
      return (
        <span className="max-w-32 truncate sm:max-w-72 md:max-w-[31rem]">
          {row.getValue("email")}
        </span>
      );
    },
  },
  {
    accessorKey: "phone",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Telefone" />
    ),
    cell: ({ row }) => {
      const phone = row.getValue<string>("phone");
      return <span className="whitespace-nowrap">{phone}</span>;
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    meta: { className: "ps-1", tdClassName: "ps-3" },
    cell: ({ row }) => {
      const status = row.getValue<string>("status");
      return (
        <div className="flex items-center gap-2">
          {status === "active" ? (
            <span className="text-green-600 dark:text-green-400">Ativo</span>
          ) : (
            <span className="text-red-600 dark:text-red-400">Inativo</span>
          )}
        </div>
      );
    },
    filterFn: (row, id, value) => {
      const status = row.getValue<string>(id);
      return value.includes(status === "active" ? "active" : "inactive");
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
];
