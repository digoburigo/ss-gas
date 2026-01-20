import type { ColumnDef } from "@tanstack/react-table";

import type { Product } from "@acme/zen-v3/zenstack/models";
import { Badge } from "@acme/ui/badge";
import { Checkbox } from "@acme/ui/checkbox";

import { DataTableColumnHeader } from "~/components/data-table";
import { DataTableRowActions } from "./data-table-row-actions";

export const productsColumns: ColumnDef<Product>[] = [
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
    accessorKey: "code",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Código" />
    ),
    cell: ({ row }) => (
      <div className="w-[100px] font-medium">{row.getValue("code")}</div>
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
    accessorKey: "category",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Categoria" />
    ),
    meta: { className: "ps-1", tdClassName: "ps-4" },
    cell: ({ row }) => {
      const category = row.getValue<string | null>("category");
      if (!category) return null;
      return (
        <Badge variant="outline" className="capitalize">
          {category}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      const category = row.getValue<string | null>(id);
      if (!category) return false;
      return value.includes(category);
    },
  },
  {
    accessorKey: "unit",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Unidade" />
    ),
    cell: ({ row }) => {
      const unit = row.getValue<string | null>("unit");
      return <span className="whitespace-nowrap">{unit ?? "-"}</span>;
    },
  },
  {
    accessorKey: "costPrice",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Preço de Custo" />
    ),
    cell: ({ row }) => {
      const price = row.getValue<number | null>("costPrice");
      return (
        <span className="whitespace-nowrap">
          {price ? `R$ ${price.toFixed(2)}` : "-"}
        </span>
      );
    },
  },
  {
    accessorKey: "salePrice",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Preço de Venda" />
    ),
    cell: ({ row }) => {
      const price = row.getValue<number | null>("salePrice");
      return (
        <span className="whitespace-nowrap">
          {price ? `R$ ${price.toFixed(2)}` : "-"}
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
        <div className="flex items-center gap-2">
          {active ? (
            <span className="text-green-600 dark:text-green-400">Ativo</span>
          ) : (
            <span className="text-red-600 dark:text-red-400">Inativo</span>
          )}
        </div>
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
