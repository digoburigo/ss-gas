import type { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type { SortingState } from "@tanstack/react-table";
import { Edit, Eye, Plus, Trash2 } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@acme/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@acme/ui/tooltip";

import { DataTableColumnHeader } from "~/components/data-table/column-header";
import { DataTablePagination } from "~/components/data-table";
import {
  getEntityTypeInfo,
  getActionTypeInfo,
  getActionColorClasses,
  formatFieldName,
  formatValue,
} from "../data/data";
import { useAuditLog } from "./audit-log-provider";

export type AuditLogEntry = {
  id: string;
  entityType: string;
  entityId: string;
  entityName: string | null;
  action: string;
  field: string | null;
  oldValue: string | null;
  newValue: string | null;
  changes: string | null;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  createdAt: string;
};

const columns: ColumnDef<AuditLogEntry>[] = [
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Data/Hora" />
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue("createdAt"));
      return (
        <div className="flex flex-col">
          <span className="font-medium">
            {date.toLocaleDateString("pt-BR")}
          </span>
          <span className="text-muted-foreground text-xs">
            {date.toLocaleTimeString("pt-BR")}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "userName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Usuário" />
    ),
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium">
          {row.original.userName ?? "Sistema"}
        </span>
        {row.original.userEmail && (
          <span className="text-muted-foreground text-xs">
            {row.original.userEmail}
          </span>
        )}
      </div>
    ),
  },
  {
    accessorKey: "entityType",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Entidade" />
    ),
    cell: ({ row }) => {
      const entityInfo = getEntityTypeInfo(row.original.entityType);
      const Icon = entityInfo?.icon;
      return (
        <div className="flex items-center gap-2">
          {Icon && <Icon className="text-muted-foreground h-4 w-4" />}
          <div className="flex flex-col">
            <span className="font-medium">
              {entityInfo?.label ?? row.original.entityType}
            </span>
            {row.original.entityName && (
              <span className="text-muted-foreground text-xs">
                {row.original.entityName}
              </span>
            )}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "action",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Ação" />
    ),
    cell: ({ row }) => {
      const action = row.original.action;
      const actionInfo = getActionTypeInfo(action);
      const colorClasses = getActionColorClasses(action);
      const Icon =
        action === "create" ? Plus : action === "delete" ? Trash2 : Edit;

      return (
        <Badge className={colorClasses.badge}>
          <Icon className="mr-1 h-3 w-3" />
          {actionInfo?.label ?? action}
        </Badge>
      );
    },
  },
  {
    accessorKey: "field",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Campo" />
    ),
    cell: ({ row }) => {
      const field = row.original.field;
      if (!field) {
        return <span className="text-muted-foreground">-</span>;
      }
      return <span className="font-mono text-sm">{formatFieldName(field)}</span>;
    },
  },
  {
    id: "values",
    header: "Alteração",
    cell: ({ row }) => {
      const { oldValue, newValue, action } = row.original;

      if (action === "create") {
        return (
          <span className="text-muted-foreground text-sm italic">
            Registro criado
          </span>
        );
      }

      if (action === "delete") {
        return (
          <span className="text-muted-foreground text-sm italic">
            Registro excluído
          </span>
        );
      }

      const oldFormatted = formatValue(oldValue);
      const newFormatted = formatValue(newValue);

      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex max-w-[200px] flex-col gap-1">
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground text-xs">De:</span>
                  <span className="truncate text-sm line-through opacity-60">
                    {oldFormatted.length > 30
                      ? `${oldFormatted.slice(0, 30)}...`
                      : oldFormatted}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground text-xs">Para:</span>
                  <span className="truncate text-sm font-medium">
                    {newFormatted.length > 30
                      ? `${newFormatted.slice(0, 30)}...`
                      : newFormatted}
                  </span>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-md">
              <div className="flex flex-col gap-2">
                <div>
                  <p className="font-medium">Valor anterior:</p>
                  <pre className="text-muted-foreground mt-1 max-h-32 overflow-auto whitespace-pre-wrap text-xs">
                    {oldFormatted}
                  </pre>
                </div>
                <div>
                  <p className="font-medium">Novo valor:</p>
                  <pre className="mt-1 max-h-32 overflow-auto whitespace-pre-wrap text-xs">
                    {newFormatted}
                  </pre>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const { setOpen, setSelectedLogId } = useAuditLog();
      const log = row.original;

      return (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSelectedLogId(log.id);
            setOpen("details");
          }}
        >
          <Eye className="mr-1 h-4 w-4" />
          Detalhes
        </Button>
      );
    },
  },
];

type AuditLogTableProps = {
  data: AuditLogEntry[];
  isLoading?: boolean;
};

export function AuditLogTable({ data, isLoading = false }: AuditLogTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center py-8">
        <p>Carregando histórico de auditoria...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                const colorClasses = getActionColorClasses(row.original.action);
                return (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className={`border-l-4 ${colorClasses.border}`}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Nenhum registro de auditoria encontrado no período.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} className="mt-auto" />
    </div>
  );
}
