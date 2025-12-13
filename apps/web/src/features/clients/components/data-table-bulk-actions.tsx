import { Button } from "@acme/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@acme/ui/tooltip";
import type { Client } from "@acme/zen-v3/zenstack/models";
import type { Table } from "@tanstack/react-table";
import { Download, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { DataTableBulkActions as BulkActionsToolbar } from "~/components/data-table";
import { ClientsMultiDeleteDialog } from "./clients-multi-delete-dialog";

type DataTableBulkActionsProps<TData> = {
	table: Table<TData>;
};

export function DataTableBulkActions<TData>({
	table,
}: DataTableBulkActionsProps<TData>) {
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const selectedRows = table.getFilteredSelectedRowModel().rows;

	const handleBulkExport = () => {
		const selectedClients = selectedRows.map((row) => row.original as Client);
		toast.promise(
			new Promise((resolve) => {
				// Simulate export
				setTimeout(() => {
					console.log("Exporting clients:", selectedClients);
					resolve(undefined);
				}, 500);
			}),
			{
				loading: "Exportando clientes...",
				success: () => {
					table.resetRowSelection();
					return `Exportados ${selectedClients.length} cliente${selectedClients.length > 1 ? "s" : ""} para CSV.`;
				},
				error: "Erro ao exportar",
			},
		);
		table.resetRowSelection();
	};

	return (
		<>
			<BulkActionsToolbar table={table} entityName="cliente">
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="outline"
							size="icon"
							onClick={() => handleBulkExport()}
							className="size-8"
							aria-label="Exportar clientes"
							title="Exportar clientes"
						>
							<Download />
							<span className="sr-only">Exportar clientes</span>
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						<p>Exportar clientes</p>
					</TooltipContent>
				</Tooltip>

				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="destructive"
							size="icon"
							onClick={() => setShowDeleteConfirm(true)}
							className="size-8"
							aria-label="Excluir clientes selecionados"
							title="Excluir clientes selecionados"
						>
							<Trash2 />
							<span className="sr-only">Excluir clientes selecionados</span>
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						<p>Excluir clientes selecionados</p>
					</TooltipContent>
				</Tooltip>
			</BulkActionsToolbar>

			<ClientsMultiDeleteDialog
				open={showDeleteConfirm}
				onOpenChange={setShowDeleteConfirm}
				table={table}
			/>
		</>
	);
}
