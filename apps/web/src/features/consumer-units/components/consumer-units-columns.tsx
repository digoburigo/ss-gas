import type { ColumnDef } from "@tanstack/react-table";

import type { GasUnit } from "@acme/zen-v3/zenstack/models";
import { Badge } from "@acme/ui/badge";
import { Checkbox } from "@acme/ui/checkbox";

import { DataTableColumnHeader } from "~/components/data-table";
import { DataTableRowActions } from "./data-table-row-actions";

export const consumerUnitsColumns: ColumnDef<GasUnit>[] = [
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
    accessorKey: "code",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Código do Medidor" />
    ),
    meta: { className: "ps-1", tdClassName: "ps-4" },
    cell: ({ row }) => {
      return (
        <span className="font-mono text-sm font-medium">
          {row.getValue("code")}
        </span>
      );
    },
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
    accessorKey: "city",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Localização" />
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
    accessorKey: "contract",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Contrato" />
    ),
    cell: ({ row }) => {
      const contract = row.original.contract;
      return <span className="truncate">{contract ? contract.name : "-"}</span>;
    },
  },
  {
    accessorKey: "responsibleEmails",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Responsáveis" />
    ),
    cell: ({ row }) => {
      const emails = row.original.responsibleEmails;
      if (!emails || emails.length === 0) {
        return <span className="text-muted-foreground">-</span>;
      }
      return (
        <div className="flex flex-col">
          <span className="truncate text-sm">{emails[0]}</span>
          {emails.length > 1 && (
            <span className="text-muted-foreground text-xs">
              +{emails.length - 1}{" "}
              {emails.length - 1 === 1 ? "outro" : "outros"}
            </span>
          )}
        </div>
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
