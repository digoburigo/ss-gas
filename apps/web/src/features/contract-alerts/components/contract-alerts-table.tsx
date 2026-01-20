"use no memo";

import type { SortingState, VisibilityState } from "@tanstack/react-table";
import { useEffect, useState } from "react";
import { getRouteApi } from "@tanstack/react-router";
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useClientQueries } from "@zenstackhq/tanstack-query/react";

import type {
  GasContract,
  GasContractAlert,
  GasContractAlertRecipient,
} from "@acme/zen-v3/zenstack/models";
import { cn } from "@acme/ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@acme/ui/table";
import { schema } from "@acme/zen-v3/zenstack/schema";

import { DataTablePagination, DataTableToolbar } from "~/components/data-table";
import { useTableUrlState } from "~/hooks/use-table-url-state";
import { eventTypeOptions, statusOptions } from "../data/data";
import { contractAlertsColumns as columns } from "./contract-alerts-columns";

type GasContractAlertWithRelations = GasContractAlert & {
  contract?: GasContract | null;
  recipients?: GasContractAlertRecipient[];
};

// @ts-expect-error - Route will be registered after build
const route = getRouteApi("/_authenticated/gas/contract-alerts/");

export function ContractAlertsTable() {
  const client = useClientQueries(schema);
  const { data: alerts = [], isFetching } = client.gasContractAlert.useFindMany(
    {
      include: {
        contract: true,
        recipients: true,
      },
      orderBy: { createdAt: "desc" },
    },
  );

  // Local UI-only states
  const [rowSelection, setRowSelection] = useState({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  // Synced with URL states
  const {
    globalFilter,
    onGlobalFilterChange,
    columnFilters,
    onColumnFiltersChange,
    pagination,
    onPaginationChange,
    ensurePageInRange,
  } = useTableUrlState({
    search: route.useSearch(),
    navigate: route.useNavigate(),
    pagination: { defaultPage: 1, defaultPageSize: 10 },
    globalFilter: { enabled: true, key: "filter" },
    columnFilters: [
      { columnId: "active", searchKey: "status", type: "array" },
      { columnId: "eventType", searchKey: "type", type: "array" },
    ],
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: alerts as GasContractAlertWithRelations[],
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      globalFilter,
      pagination,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    globalFilterFn: (row, _columnId, filterValue) => {
      const eventName = String(row.getValue("eventName")).toLowerCase();
      const contract = row.original.contract;
      const contractName = contract ? contract.name.toLowerCase() : "";
      const searchValue = String(filterValue).toLowerCase();

      return (
        eventName.includes(searchValue) || contractName.includes(searchValue)
      );
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    onPaginationChange,
    onGlobalFilterChange,
    onColumnFiltersChange,
  });

  const pageCount = table.getPageCount();
  useEffect(() => {
    ensurePageInRange(pageCount);
  }, [pageCount, ensurePageInRange]);

  if (isFetching) {
    return (
      <div className="flex flex-1 items-center justify-center py-8">
        <p>Carregando alertas de contratos...</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'max-sm:has-[div[role="toolbar"]]:mb-16',
        "flex flex-1 flex-col gap-4",
      )}
    >
      <DataTableToolbar
        table={table}
        searchPlaceholder="Filtrar por nome do evento ou contrato..."
        filters={[
          {
            columnId: "active",
            title: "Status",
            options: statusOptions.map((s) => ({
              label: s.label,
              value: s.value,
            })),
          },
          {
            columnId: "eventType",
            title: "Tipo de Evento",
            options: eventTypeOptions.map((e) => ({
              label: e.label,
              value: e.value,
            })),
          },
        ]}
      />
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      colSpan={header.colSpan}
                      className={cn(
                        (
                          header.column.columnDef.meta as {
                            className?: string;
                          }
                        )?.className,
                        (
                          header.column.columnDef.meta as {
                            thClassName?: string;
                          }
                        )?.thClassName,
                      )}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        (
                          cell.column.columnDef.meta as {
                            className?: string;
                          }
                        )?.className,
                        (
                          cell.column.columnDef.meta as {
                            tdClassName?: string;
                          }
                        )?.tdClassName,
                      )}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Nenhum alerta configurado.
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
