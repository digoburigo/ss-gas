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

import type { NavigateFn } from "~/hooks/use-table-url-state";
import { DataTablePagination, DataTableToolbar } from "~/components/data-table";
import { useTableUrlState } from "~/hooks/use-table-url-state";
import { submissionStatuses } from "../data/data";
import { columns } from "./daily-scheduling-columns";

export function DailySchedulingTable() {
  const client = useClientQueries(schema);

  const { data: dailyPlans = [], isFetching } = client.gasDailyPlan.useFindMany(
    {
      include: {
        unit: {
          include: {
            contract: true,
          },
        },
        createdByUser: true,
        submittedByUser: true,
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    },
  );

  // Local UI-only states
  const [rowSelection, setRowSelection] = useState({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  // Get route search and navigate
  let search: Record<string, unknown> = {};
  let navigate: NavigateFn = () => {};

  try {
    // @ts-expect-error - Route may not be registered yet during initial build
    const route = getRouteApi("/_authenticated/gas/scheduling/");
    search = route.useSearch() as Record<string, unknown>;
    navigate = route.useNavigate() as unknown as NavigateFn;
  } catch {
    // Route not registered yet - use fallback
  }

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
    search,
    navigate,
    pagination: { defaultPage: 1, defaultPageSize: 10 },
    globalFilter: { enabled: true, key: "filter" },
    columnFilters: [{ columnId: "status", searchKey: "status", type: "array" }],
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: dailyPlans,
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
      const unitName = String(row.original.unit?.name || "").toLowerCase();
      const unitCode = String(row.original.unit?.code || "").toLowerCase();
      const contractName = String(
        row.original.unit?.contract?.name || "",
      ).toLowerCase();
      const searchValue = String(filterValue).toLowerCase();

      return (
        unitName.includes(searchValue) ||
        unitCode.includes(searchValue) ||
        contractName.includes(searchValue)
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
        <p>Carregando programações...</p>
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
        searchPlaceholder="Filtrar por unidade, código ou contrato..."
        filters={[
          {
            columnId: "status",
            title: "Status",
            options: submissionStatuses.map((s) => ({
              label: s.label,
              value: s.value,
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
                    <TableHead key={header.id} colSpan={header.colSpan}>
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
                    <TableCell key={cell.id}>
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
                  Nenhuma programação encontrada.
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
