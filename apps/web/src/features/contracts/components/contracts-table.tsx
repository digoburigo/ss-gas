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

import { FileUp, Sparkles, Upload } from "lucide-react";

import type { GasContract } from "@acme/zen-v3/zenstack/models";
import { cn } from "@acme/ui";
import { Button } from "@acme/ui/button";
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
import { useContracts } from "./contracts-provider";
import { useTableUrlState } from "~/hooks/use-table-url-state";
import { statusOptions } from "../data/data";
import { contractsColumns as columns } from "./contracts-columns";

const route = getRouteApi("/_authenticated/gas/contracts/");

export function ContractsTable() {
  const { setOpen } = useContracts();
  const client = useClientQueries(schema);
  const { data: contracts = [], isFetching } = client.gasContract.useFindMany({
    take: 99,
    include: {
      units: true,
      unitContracts: {
        include: {
          unit: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

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
    columnFilters: [{ columnId: "active", searchKey: "status", type: "array" }],
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: contracts as GasContract[],
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
      const name = String(row.getValue("name")).toLowerCase();
      const supplier = String(row.getValue("supplier") || "").toLowerCase();
      const contractNumber = String(
        row.original.contractNumber || "",
      ).toLowerCase();
      const searchValue = String(filterValue).toLowerCase();

      return (
        name.includes(searchValue) ||
        supplier.includes(searchValue) ||
        contractNumber.includes(searchValue)
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
        <p>Carregando contratos...</p>
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
        searchPlaceholder="Filtrar por nome, fornecedor ou número..."
        filters={[
          {
            columnId: "active",
            title: "Status",
            options: statusOptions.map((s) => ({
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
                    <TableHead
                      key={header.id}
                      colSpan={header.colSpan}
                      className={cn(
                        header.column.columnDef.meta?.className,
                        header.column.columnDef.meta?.thClassName,
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
                        cell.column.columnDef.meta?.className,
                        cell.column.columnDef.meta?.tdClassName,
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
                  {contracts.length === 0 ? (
                    <div className="flex flex-col items-center gap-4 py-8">
                      <div className="rounded-full bg-muted p-4">
                        <FileUp className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-semibold text-lg">
                          Nenhum contrato cadastrado
                        </p>
                        <p className="text-muted-foreground text-sm max-w-md mx-auto">
                          Faça upload de um contrato em PDF e nossa IA extrairá
                          automaticamente as informações como fornecedor,
                          vigência, volumes e cláusulas.
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => setOpen("upload")}>
                          <Upload className="mr-2 h-4 w-4" />
                          Upload com IA
                          <Sparkles className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    "Nenhum contrato encontrado."
                  )}
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
