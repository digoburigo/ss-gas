"use no memo";

import type { SortingState, VisibilityState } from "@tanstack/react-table";
import { useEffect, useMemo, useState } from "react";
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
import { format, isAfter, isSameDay, parseISO, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

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
import { schedulingStatuses } from "../data/data";
import { useSchedulingDashboard } from "./scheduling-dashboard-provider";
import { createColumns } from "./scheduling-dashboard-columns";

export interface UnitSchedulingStatus {
  id: string;
  unitId: string;
  unitName: string;
  unitCode: string;
  contractId: string | null;
  contractName: string | null;
  status: "scheduled" | "pending" | "late";
  scheduledVolume: number | null;
  scheduledAt: Date | null;
  date: Date;
}

export function SchedulingDashboardTable() {
  const client = useClientQueries(schema);
  const { selectedDate } = useSchedulingDashboard();

  // Fetch all active units
  const { data: units = [], isFetching: isFetchingUnits } =
    client.gasUnit.useFindMany({
      where: { active: true },
      include: {
        contract: {
          select: {
            id: true,
            name: true,
            dailySchedulingDeadline: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

  // Fetch daily plans for the selected date
  const dateStr = format(selectedDate, "yyyy-MM-dd");
  const { data: dailyPlans = [], isFetching: isFetchingPlans } =
    client.gasDailyPlan.useFindMany({
      where: {
        date: new Date(dateStr),
      },
      include: {
        unit: true,
        createdByUser: true,
      },
    });

  // Compute the status for each unit
  const unitStatuses = useMemo((): UnitSchedulingStatus[] => {
    const now = new Date();
    const today = startOfDay(now);
    const selectedDay = startOfDay(selectedDate);
    const isToday = isSameDay(selectedDay, today);
    const isPast = isAfter(today, selectedDay);

    return units.map((unit) => {
      // Find if this unit has a plan for the selected date
      const plan = dailyPlans.find((p) => p.unitId === unit.id);

      let status: "scheduled" | "pending" | "late" = "pending";

      if (plan) {
        // Has a scheduled plan
        status = "scheduled";
      } else if (isPast && !isToday) {
        // Date is in the past and no schedule - late
        status = "late";
      } else if (isToday) {
        // Today - check if past deadline
        const deadlineStr = unit.contract?.dailySchedulingDeadline;
        if (deadlineStr) {
          const [hours, minutes] = deadlineStr.split(":").map(Number);
          if (hours !== undefined && minutes !== undefined) {
            const deadline = new Date(selectedDay);
            deadline.setHours(hours, minutes, 0, 0);
            if (isAfter(now, deadline)) {
              status = "late";
            }
          }
        }
      }

      return {
        id: unit.id,
        unitId: unit.id,
        unitName: unit.name,
        unitCode: unit.code,
        contractId: unit.contractId,
        contractName: unit.contract?.name ?? null,
        status,
        scheduledVolume: plan?.qdpValue ?? null,
        scheduledAt: plan?.createdAt ? new Date(plan.createdAt) : null,
        date: selectedDate,
      };
    });
  }, [units, dailyPlans, selectedDate]);

  // Summary counts
  const summary = useMemo(() => {
    const scheduled = unitStatuses.filter((u) => u.status === "scheduled").length;
    const pending = unitStatuses.filter((u) => u.status === "pending").length;
    const late = unitStatuses.filter((u) => u.status === "late").length;
    return { scheduled, pending, late, total: unitStatuses.length };
  }, [unitStatuses]);

  // Local UI-only states
  const [rowSelection, setRowSelection] = useState({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  // Get route search and navigate
  let search: Record<string, unknown> = {};
  let navigate: NavigateFn = () => {};

  try {
    // @ts-expect-error - Route may not be registered yet during initial build
    const route = getRouteApi("/_authenticated/gas/scheduling-dashboard/");
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
    columnFilters: [
      { columnId: "status", searchKey: "status", type: "array" },
      { columnId: "contractName", searchKey: "contract", type: "array" },
    ],
  });

  const columns = useMemo(() => createColumns(), []);

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: unitStatuses,
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
      const unitName = String(row.original.unitName || "").toLowerCase();
      const unitCode = String(row.original.unitCode || "").toLowerCase();
      const contractName = String(row.original.contractName || "").toLowerCase();
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

  const isFetching = isFetchingUnits || isFetchingPlans;

  // Get unique contracts for filter
  const contractOptions = useMemo(() => {
    const contracts = new Map<string, string>();
    for (const unit of units) {
      if (unit.contractId && unit.contract?.name) {
        contracts.set(unit.contractId, unit.contract.name);
      }
    }
    return Array.from(contracts.entries()).map(([value, label]) => ({
      value,
      label,
    }));
  }, [units]);

  if (isFetching) {
    return (
      <div className="flex flex-1 items-center justify-center py-8">
        <p>Carregando dados...</p>
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
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">Total de Unidades</p>
          <p className="text-2xl font-bold">{summary.total}</p>
        </div>
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-900/20">
          <p className="text-sm text-green-700 dark:text-green-400">Programado</p>
          <p className="text-2xl font-bold text-green-700 dark:text-green-400">
            {summary.scheduled}
          </p>
        </div>
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-900/20">
          <p className="text-sm text-yellow-700 dark:text-yellow-400">Pendente</p>
          <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">
            {summary.pending}
          </p>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-900/20">
          <p className="text-sm text-red-700 dark:text-red-400">Atrasado</p>
          <p className="text-2xl font-bold text-red-700 dark:text-red-400">
            {summary.late}
          </p>
        </div>
      </div>

      <DataTableToolbar
        table={table}
        searchPlaceholder="Filtrar por unidade, código ou contrato..."
        filters={[
          {
            columnId: "status",
            title: "Status",
            options: schedulingStatuses.map((s) => ({
              label: s.label,
              value: s.value,
            })),
          },
          ...(contractOptions.length > 0
            ? [
                {
                  columnId: "contractName",
                  title: "Contrato",
                  options: contractOptions,
                },
              ]
            : []),
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
                  className={cn(
                    row.original.status === "pending" &&
                      "bg-yellow-50/50 dark:bg-yellow-900/10",
                    row.original.status === "late" &&
                      "bg-red-50/50 dark:bg-red-900/10",
                  )}
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
                  Nenhuma unidade encontrada.
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
