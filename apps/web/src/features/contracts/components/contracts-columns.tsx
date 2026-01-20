import type { ColumnDef } from "@tanstack/react-table";

import type { GasContract } from "@acme/zen-v3/zenstack/models";
import { Badge } from "@acme/ui/badge";
import { Checkbox } from "@acme/ui/checkbox";

import { DataTableColumnHeader } from "~/components/data-table";
import { DataTableRowActions } from "./data-table-row-actions";

export const contractsColumns: ColumnDef<GasContract>[] = [
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
      <DataTableColumnHeader column={column} title="Nome do Contrato" />
    ),
    meta: { className: "ps-1", tdClassName: "ps-4" },
    cell: ({ row }) => {
      return (
        <div className="flex flex-col">
          <span className="max-w-48 truncate font-medium">
            {row.getValue("name")}
          </span>
          {row.original.contractNumber && (
            <span className="text-muted-foreground text-xs">
              {row.original.contractNumber}
            </span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "supplier",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Fornecedor" />
    ),
    cell: ({ row }) => {
      const supplier = row.getValue<string | null>("supplier");
      return <span className="max-w-32 truncate">{supplier || "-"}</span>;
    },
  },
  {
    accessorKey: "qdcContracted",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="QDC" />
    ),
    cell: ({ row }) => {
      const qdc = row.getValue<number>("qdcContracted");
      const unit = row.original.volumeUnit;
      return (
        <span className="font-mono text-sm">
          {qdc.toLocaleString("pt-BR")} {unit}
        </span>
      );
    },
  },
  {
    accessorKey: "effectiveFrom",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Vigência" />
    ),
    cell: ({ row }) => {
      const from = row.original.effectiveFrom;
      const to = row.original.effectiveTo;
      const formatDate = (d: Date | string) =>
        new Date(d).toLocaleDateString("pt-BR");
      return (
        <div className="flex flex-col text-sm">
          <span>
            {formatDate(from)} - {to ? formatDate(to) : "Indeterminado"}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "units",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Unidades" />
    ),
    cell: ({ row }) => {
      const units = row.original.units;
      if (!units || units.length === 0) {
        return <span className="text-muted-foreground">Nenhuma</span>;
      }
      return (
        <div className="flex flex-col">
          <span className="text-sm">{units.length} unidade(s)</span>
          {units.length > 0 && (
            <span className="text-muted-foreground max-w-24 truncate text-xs">
              {units[0].name}
              {units.length > 1 && ` +${units.length - 1}`}
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
