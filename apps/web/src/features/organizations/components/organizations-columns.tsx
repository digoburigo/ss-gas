import type { ColumnDef } from "@tanstack/react-table";

import type { Organization } from "@acme/zen-v3/zenstack/models";
import { Badge } from "@acme/ui/badge";
import { Checkbox } from "@acme/ui/checkbox";

import { DataTableColumnHeader } from "~/components/data-table";
import { DataTableRowActions } from "./data-table-row-actions";

export const organizationsColumns: ColumnDef<Organization>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Selecionar todos"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Selecionar linha"
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
    accessorKey: "cnpj",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="CNPJ" />
    ),
    meta: { className: "ps-1", tdClassName: "ps-4" },
    cell: ({ row }) => {
      const cnpj = row.getValue<string | null>("cnpj");
      return <span className="font-mono text-sm">{cnpj || "-"}</span>;
    },
  },
  {
    accessorKey: "contactName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Contato" />
    ),
    cell: ({ row }) => {
      const contactName = row.getValue<string | null>("contactName");
      const contactEmail = row.original.contactEmail;
      return (
        <div className="flex flex-col">
          <span className="truncate">{contactName || "-"}</span>
          {contactEmail && (
            <span className="text-muted-foreground truncate text-xs">
              {contactEmail}
            </span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "city",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Cidade" />
    ),
    cell: ({ row }) => {
      const city = row.getValue<string | null>("city");
      const state = row.original.state;
      return (
        <span className="whitespace-nowrap">
          {city ? `${city}${state ? ` - ${state}` : ""}` : "-"}
        </span>
      );
    },
  },
  {
    accessorKey: "active",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    meta: { className: "ps-1", tdClassName: "ps-3" },
    cell: ({ row }) => {
      const active = row.getValue<boolean>("active");
      return (
        <Badge variant={active ? "default" : "secondary"}>
          {active ? "Ativo" : "Inativo"}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      const active = row.getValue<boolean>(id);
      return value.includes(active ? "active" : "inactive");
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
];
