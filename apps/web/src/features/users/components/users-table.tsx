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

import type { Member } from "../data/schema";
import { DataTablePagination, DataTableToolbar } from "~/components/data-table";
import { authClient } from "~/clients/auth-client";
import { useTableUrlState } from "~/hooks/use-table-url-state";
import { profiles, roles } from "../data/data";
import { DataTableBulkActions } from "./data-table-bulk-actions";
import { usersColumns as columns } from "./users-columns";

const route = getRouteApi("/_authenticated/users/");

export function UsersTable() {
  const { data: activeOrganization } = authClient.useActiveOrganization();

  // Get members from ZenStack with user relation
  const client = useClientQueries(schema);
  const { data: zenstackMembers = [], isPending } = client.member.useFindMany({
    where: { organizationId: activeOrganization?.id ?? "" },
    include: {
      user: true,
      unitAssignments: {
        select: {
          unitId: true,
        },
      },
    },
  });

  // Transform ZenStack members to our Member type
  const members = useMemo(() => {
    return zenstackMembers.map((member) => ({
      id: member.id,
      userId: member.userId,
      organizationId: member.organizationId,
      role: member.role as "owner" | "admin" | "member",
      createdAt: new Date(member.createdAt),
      user: {
        id: member.user.id,
        name: member.user.name,
        email: member.user.email,
        image: member.user.image,
        emailVerified: member.user.emailVerified,
      },
      profile: (member.profile ?? "viewer") as
        | "admin"
        | "manager"
        | "operator"
        | "viewer",
      deactivatedAt: member.deactivatedAt
        ? new Date(member.deactivatedAt)
        : null,
    })) satisfies Member[];
  }, [zenstackMembers]);

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
    globalFilter: { enabled: true, key: "username" },
    columnFilters: [
      { columnId: "status", searchKey: "status", type: "array" },
      { columnId: "profile", searchKey: "profile", type: "array" },
      { columnId: "role", searchKey: "role", type: "array" },
    ],
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: members,
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
      const user = row.original.user;
      const searchValue = String(filterValue).toLowerCase();

      return (
        user.name.toLowerCase().includes(searchValue) ||
        user.email.toLowerCase().includes(searchValue)
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

  if (isPending) {
    return (
      <div className="flex flex-1 items-center justify-center py-8">
        <p>Carregando usuários...</p>
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
        searchPlaceholder="Filtrar por nome ou email..."
        filters={[
          {
            columnId: "status",
            title: "Status",
            options: [
              { label: "Ativo", value: "active" },
              { label: "Desativado", value: "inactive" },
            ],
          },
          {
            columnId: "profile",
            title: "Perfil",
            options: profiles.map((p) => ({ label: p.label, value: p.value })),
          },
          {
            columnId: "role",
            title: "Cargo",
            options: roles.map((r) => ({ label: r.label, value: r.value })),
          },
        ]}
      />
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="group/row">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      colSpan={header.colSpan}
                      className={cn(
                        "bg-background group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted",
                        (header.column.columnDef.meta as { className?: string })
                          ?.className,
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
                  className="group/row"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        "bg-background group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted",
                        (cell.column.columnDef.meta as { className?: string })
                          ?.className,
                        (cell.column.columnDef.meta as { tdClassName?: string })
                          ?.tdClassName,
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
                  Nenhum usuário encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} className="mt-auto" />
      <DataTableBulkActions table={table} />
    </div>
  );
}
