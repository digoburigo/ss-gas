"use no memo";

import type { SortingState, VisibilityState } from "@tanstack/react-table";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { format, isAfter, isSameDay, startOfDay } from "date-fns";
import { toast } from "sonner";

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
import { api } from "~/clients/api-client";
import { DataTablePagination, DataTableToolbar } from "~/components/data-table";
import { useTableUrlState } from "~/hooks/use-table-url-state";
import { schedulingStatuses } from "../data/data";
import { createColumns } from "./scheduling-dashboard-columns";
import { useSchedulingDashboard } from "./scheduling-dashboard-provider";

export interface UnitSchedulingStatus {
  id: string;
  unitId: string;
  unitName: string;
  unitCode: string;
  contractId: string | null;
  contractName: string | null;
  contractNames: string[];
  status: "scheduled" | "pending" | "late";
  scheduledVolume: number | null;
  scheduledAt: Date | null;
  date: Date;
  planId: string | null;
  submitted: boolean;
  approved: boolean | null;
  rejectionReason: string | null;
}

export function SchedulingDashboardTable() {
  const client = useClientQueries(schema);
  const queryClient = useQueryClient();
  const { selectedDate, setDrawerOpen, setSelectedUnitId } =
    useSchedulingDashboard();

  // Fetch all active units
  const { data: units = [], isFetching: isFetchingUnits } =
    client.gasUnit.useFindMany({
      take: 99,
      where: { active: true },
      include: {
        contract: {
          select: {
            id: true,
            name: true,
            dailySchedulingDeadline: true,
          },
        },
        unitContracts: {
          include: {
            contract: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

  // Fetch daily plans for the selected date with workflow fields
  const dateStr = format(selectedDate, "yyyy-MM-dd");
  const { data: dailyPlans = [], isFetching: isFetchingPlans } =
    client.gasDailyPlan.useFindMany({
      take: 99,
      where: {
        date: new Date(dateStr),
      },
    });

  // Submit plan mutation
  const submitPlanMutation = useMutation({
    mutationFn: async (planId: string) => {
      const response = await api.gas["daily-plans"]({ planId }).submit.post({});
      if (response.error) {
        const errorObj = response.error as { error?: string };
        throw new Error(errorObj.error ?? "Failed to submit plan");
      }
      return response.data;
    },
    onSuccess: () => {
      toast.success("Programação submetida para aprovação!");
      queryClient.invalidateQueries({ queryKey: ["GasDailyPlan"] });
      queryClient.invalidateQueries({ queryKey: ["gasDailyPlan"] });
    },
    onError: (error: Error) => {
      toast.error(`Erro ao submeter: ${error.message}`);
    },
  });

  // Approve plan mutation
  const approvePlanMutation = useMutation({
    mutationFn: async ({
      planId,
      approved,
      rejectionReason,
    }: {
      planId: string;
      approved: boolean;
      rejectionReason?: string;
    }) => {
      const response = await api.gas["daily-plans"]({ planId }).approve.post({
        approved,
        rejectionReason,
      });
      if (response.error) {
        const errorObj = response.error as { error?: string };
        throw new Error(errorObj.error ?? "Failed to approve plan");
      }
      return response.data;
    },
    onSuccess: (_data, variables) => {
      toast.success(
        variables.approved ? "Programação aprovada!" : "Programação rejeitada.",
      );
      queryClient.invalidateQueries({ queryKey: ["GasDailyPlan"] });
      queryClient.invalidateQueries({ queryKey: ["gasDailyPlan"] });
    },
    onError: (error: Error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const handleCreateEntry = (unitId: string) => {
    setSelectedUnitId(unitId);
    setDrawerOpen("create-entry");
  };

  const handleSubmitPlan = (planId: string) => {
    submitPlanMutation.mutate(planId);
  };

  const handleApprovePlan = (planId: string) => {
    approvePlanMutation.mutate({ planId, approved: true });
  };

  const handleRejectPlan = (planId: string) => {
    const reason = window.prompt("Motivo da rejeição (opcional):");
    approvePlanMutation.mutate({
      planId,
      approved: false,
      rejectionReason: reason ?? undefined,
    });
  };

  // Compute the status for each unit
  const unitStatuses = useMemo((): UnitSchedulingStatus[] => {
    const now = new Date();
    const today = startOfDay(now);
    const selectedDay = startOfDay(selectedDate);
    const isToday = isSameDay(selectedDay, today);
    const isPast = isAfter(today, selectedDay);

    return units.map((unit) => {
      const plan = dailyPlans.find((p) => p.unitId === unit.id);

      let status: "scheduled" | "pending" | "late" = "pending";

      if (plan) {
        status = "scheduled";
      } else if (isPast && !isToday) {
        status = "late";
      } else if (isToday) {
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

      // Collect contract names from join table (or fallback to legacy FK)
      const joinContracts = (unit as Record<string, unknown>).unitContracts;
      const contractNames =
        Array.isArray(joinContracts) && joinContracts.length > 0
          ? joinContracts.map(
              (uc: { contract: { name: string } }) => uc.contract.name,
            )
          : unit.contract?.name
            ? [unit.contract.name]
            : [];

      return {
        id: unit.id,
        unitId: unit.id,
        unitName: unit.name,
        unitCode: unit.code,
        contractId: unit.contractId,
        contractName: unit.contract?.name ?? null,
        contractNames,
        status,
        scheduledVolume: plan?.qdpValue ?? null,
        scheduledAt: plan?.createdAt ? new Date(plan.createdAt) : null,
        date: selectedDate,
        planId: plan?.id ?? null,
        submitted: plan?.submitted ?? false,
        approved: plan?.approved ?? null,
        rejectionReason: plan?.rejectionReason ?? null,
      };
    });
  }, [units, dailyPlans, selectedDate]);

  // Summary counts
  const summary = useMemo(() => {
    const scheduled = unitStatuses.filter(
      (u) => u.status === "scheduled",
    ).length;
    const pending = unitStatuses.filter((u) => u.status === "pending").length;
    const late = unitStatuses.filter((u) => u.status === "late").length;
    const submitted = unitStatuses.filter((u) => u.submitted).length;
    const approved = unitStatuses.filter((u) => u.approved === true).length;
    return {
      scheduled,
      pending,
      late,
      submitted,
      approved,
      total: unitStatuses.length,
    };
  }, [unitStatuses]);

  // Local UI-only states
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  // Get route search and navigate
  let search: Record<string, unknown> = {};
  let navigate: NavigateFn = () => {};

  try {
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

  const columns = useMemo(
    () =>
      createColumns({
        onCreateEntry: handleCreateEntry,
        onSubmitPlan: handleSubmitPlan,
        onApprovePlan: handleApprovePlan,
        onRejectPlan: handleRejectPlan,
      }),
    [],
  );

  const table = useReactTable({
    data: unitStatuses,
    columns,
    state: {
      sorting,
      columnVisibility,
      columnFilters,
      globalFilter,
      pagination,
    },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    globalFilterFn: (row, _columnId, filterValue) => {
      const unitName = String(row.original.unitName || "").toLowerCase();
      const unitCode = String(row.original.unitCode || "").toLowerCase();
      const contractName = String(
        row.original.contractName || "",
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
      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">Total de Unidades</p>
          <p className="text-2xl font-bold">{summary.total}</p>
        </div>
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-900/20">
          <p className="text-sm text-green-700 dark:text-green-400">
            Programado
          </p>
          <p className="text-2xl font-bold text-green-700 dark:text-green-400">
            {summary.scheduled}
          </p>
        </div>
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-900/20">
          <p className="text-sm text-yellow-700 dark:text-yellow-400">
            Pendente
          </p>
          <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">
            {summary.pending}
          </p>
        </div>
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-900/20">
          <p className="text-sm text-blue-700 dark:text-blue-400">Submetido</p>
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
            {summary.submitted}
          </p>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-900/20">
          <p className="text-sm text-emerald-700 dark:text-emerald-400">
            Aprovado
          </p>
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
            {summary.approved}
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
