"use no memo";

import { cn } from "@acme/ui";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@acme/ui/table";
import type { GasUnit } from "@acme/zen-v3/zenstack/models";
import { schema } from "@acme/zen-v3/zenstack/schema";
import { getRouteApi } from "@tanstack/react-router";
import type { SortingState, VisibilityState } from "@tanstack/react-table";
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
import { useEffect, useState } from "react";

import { DataTablePagination, DataTableToolbar } from "~/components/data-table";
import { useTableUrlState } from "~/hooks/use-table-url-state";
import { statusOptions } from "../data/data";
import { consumerUnitsColumns as columns } from "./consumer-units-columns";

const route = getRouteApi("/_authenticated/gas/consumer-units/");

export function ConsumerUnitsTable() {
	const client = useClientQueries(schema);
	const { data: units = [], isFetching } = client.gasUnit.useFindMany({
		include: {
			contract: true,
		},
		orderBy: { code: "asc" },
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
		data: units as GasUnit[],
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
			const code = String(row.getValue("code")).toLowerCase();
			const name = String(row.getValue("name")).toLowerCase();
			const city = String(row.getValue("city") || "").toLowerCase();
			const searchValue = String(filterValue).toLowerCase();

			return (
				code.includes(searchValue) ||
				name.includes(searchValue) ||
				city.includes(searchValue)
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
				<p>Carregando unidades consumidoras...</p>
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
				searchPlaceholder="Filtrar por código, nome ou cidade..."
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
									Nenhuma unidade consumidora encontrada.
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
